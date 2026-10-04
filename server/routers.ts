import { z } from "zod";
import { eq, and, desc, ne, sql, or } from "drizzle-orm";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  canCloseAssistanceRequest,
  canRespondToAssistanceRequest,
  canSendAssistanceGuidance,
} from "../shared/assistance-policy";
import {
  users,
  missions,
  missionApplications,
  chatMessages,
  custodySteps,
  reviews,
  notifications,
  supportTickets,
  supportMessages,
  serviceCategories,
  missionAssistanceRequests,
  missionAssistanceGuidance,
  pushDevices,
} from "../drizzle/schema";
import { sendAssistancePush } from "./push";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return result[0] ?? null;
    }),

    setUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["requester", "correspondent", "both"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set({ userType: input.userType }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({ bio: z.string().optional(), avatarUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(users).set(input).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

  }),

  missions: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          urgency: z.enum(["low","medium","high","urgent"]).optional(),
          status: z.enum(["open","in_progress","completed","cancelled"]).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          cursor: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { missions: [], nextCursor: undefined };
        const conditions = [];
        if (input?.status) conditions.push(eq(missions.status, input.status));
        else conditions.push(eq(missions.status, "open"));
        if (input?.category) conditions.push(eq(missions.category, input.category));
        if (input?.urgency) conditions.push(eq(missions.urgency, input.urgency));
        const limit = input?.limit ?? 20;
        const results = await db
          .select()
          .from(missions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(missions.createdAt))
          .limit(limit + 1);
        let nextCursor: number | undefined;
        if (results.length > limit) {
          const next = results.pop();
          nextCursor = next?.id;
        }
        return { missions: results, nextCursor };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(missions).where(eq(missions.id, input.id)).limit(1);
        return result[0] ?? null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(5).max(255),
          description: z.string().min(10),
          category: z.string().default("other"),
          urgency: z.enum(["low","medium","high","urgent"]).default("medium"),
          location: z.string().min(3),
          deadline: z.string().optional(),
          budget: z.number().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const aiGuidance = `MissÃƒÂ£o de ${input.category}: Certifique-se de ter todos os documentos necessÃƒÂ¡rios. Prazo estimado: 1-3 dias ÃƒÂºteis.`;
        const result = await db.insert(missions).values({
          requesterId: ctx.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          urgency: input.urgency,
          location: input.location,
          deadline: input.deadline ? new Date(input.deadline) : undefined,
          budget: input.budget ? String(input.budget) : undefined,
          aiGuidance,
        }).returning({ id: missions.id });
        return { id: Number(result[0].id), success: true };
      }),

    applyToMission: protectedProcedure
      .input(z.object({ missionId: z.number(), message: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(missionApplications).values({
          missionId: input.missionId,
          correspondentId: ctx.user.id,
          message: input.message,
        });
        // Create notification for requester
        const mission = await db.select().from(missions).where(eq(missions.id, input.missionId)).limit(1);
        if (mission[0]) {
          await db.insert(notifications).values({
            userId: mission[0].requesterId,
            title: "Nova candidatura",
            body: `Um correspondente se candidatou ÃƒÂ  sua missÃƒÂ£o: ${mission[0].title}`,
            type: "mission_applied",
            relatedId: input.missionId,
          });
        }
        return { success: true };
      }),

    acceptApplication: protectedProcedure
      .input(z.object({ applicationId: z.number(), missionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const app = await db.select().from(missionApplications).where(eq(missionApplications.id, input.applicationId)).limit(1);
        if (!app[0]) throw new Error("Application not found");
        await db.update(missionApplications).set({ status: "accepted" }).where(eq(missionApplications.id, input.applicationId));
        await db.update(missionApplications).set({ status: "rejected" }).where(and(eq(missionApplications.missionId, input.missionId), ne(missionApplications.id, input.applicationId)));
        await db.update(missions).set({ status: "in_progress", correspondentId: app[0].correspondentId }).where(eq(missions.id, input.missionId));
        await db.insert(notifications).values({
          userId: app[0].correspondentId,
          title: "Candidatura aceita!",
          body: "Sua candidatura foi aceita. VocÃƒÂª pode comeÃƒÂ§ar a executar a missÃƒÂ£o.",
          type: "application_accepted",
          relatedId: input.missionId,
        });
        return { success: true };
      }),

    rejectApplication: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const app = await db.select().from(missionApplications).where(eq(missionApplications.id, input.applicationId)).limit(1);
        if (!app[0]) throw new Error("Application not found");
        await db.update(missionApplications).set({ status: "rejected" }).where(eq(missionApplications.id, input.applicationId));
        await db.insert(notifications).values({
          userId: app[0].correspondentId,
          title: "Candidatura nÃƒÂ£o selecionada",
          body: "Sua candidatura nÃƒÂ£o foi selecionada desta vez. Continue tentando!",
          type: "application_rejected",
          relatedId: app[0].missionId,
        });
        return { success: true };
      }),

    completeMission: protectedProcedure
      .input(z.object({ missionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mission = await db.select().from(missions).where(eq(missions.id, input.missionId)).limit(1);
        if (!mission[0]) throw new Error("Mission not found");
        await db.update(missions).set({ status: "completed" }).where(eq(missions.id, input.missionId));
        if (mission[0].correspondentId) {
          await db.insert(notifications).values({
            userId: mission[0].correspondentId,
            title: "MissÃƒÂ£o concluÃƒÂ­da!",
            body: "A missÃƒÂ£o foi marcada como concluÃƒÂ­da. Aguarde a avaliaÃƒÂ§ÃƒÂ£o do solicitante.",
            type: "mission_completed",
            relatedId: input.missionId,
          });
          // Update correspondent stats
          await db.update(users).set({ totalMissions: sql`totalMissions + 1` }).where(eq(users.id, mission[0].correspondentId));
        }
        return { success: true };
      }),

    getMyMissions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const asRequester = await db.select().from(missions).where(eq(missions.requesterId, ctx.user.id)).orderBy(desc(missions.createdAt));
      const asCorrespondent = await db.select().from(missions).where(eq(missions.correspondentId, ctx.user.id)).orderBy(desc(missions.createdAt));
      return { asRequester, asCorrespondent };
    }),

    getApplications: protectedProcedure
      .input(z.object({ missionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(missionApplications).where(eq(missionApplications.missionId, input.missionId));
      }),

    getCorrespondentPublicProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (!user[0]) return null;
        const userReviews = await db.select().from(reviews).where(eq(reviews.revieweeId, input.userId)).orderBy(desc(reviews.createdAt));
        return { user: user[0], reviews: userReviews };
      }),
  }),

  assistance: router({
    getForMission: protectedProcedure
      .input(z.object({ missionId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const mission = await db.select().from(missions).where(eq(missions.id, input.missionId)).limit(1);
        if (!mission[0] || (mission[0].requesterId !== ctx.user.id && mission[0].correspondentId !== ctx.user.id)) {
          throw new Error("VocÃƒÂª nÃƒÂ£o tem acesso ao acompanhamento desta missÃƒÂ£o.");
        }

        const requests = await db
          .select()
          .from(missionAssistanceRequests)
          .where(
            and(
              eq(missionAssistanceRequests.missionId, input.missionId),
              or(
                eq(missionAssistanceRequests.requesterId, ctx.user.id),
                eq(missionAssistanceRequests.recipientId, ctx.user.id),
              ),
            ),
          )
          .orderBy(desc(missionAssistanceRequests.createdAt));

        const now = new Date();
        return Promise.all(
          requests.map(async (request) => {
            const guidance = await db
              .select()
              .from(missionAssistanceGuidance)
              .where(eq(missionAssistanceGuidance.assistanceRequestId, request.id))
              .orderBy(missionAssistanceGuidance.createdAt);
            return {
              ...request,
              isExpired: request.status === "pending" && request.expiresAt <= now,
              guidance,
            };
          }),
        );
      }),

    create: protectedProcedure
      .input(
        z.object({
          missionId: z.number().int().positive(),
          note: z.string().trim().max(500, "A nota pode ter no mÃƒÂ¡ximo 500 caracteres.").optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const mission = await db.select().from(missions).where(eq(missions.id, input.missionId)).limit(1);
        const currentMission = mission[0];
        if (!currentMission || currentMission.status !== "in_progress" || !currentMission.correspondentId) {
          throw new Error("O acompanhamento sÃƒÂ³ estÃƒÂ¡ disponÃƒÂ­vel em missÃƒÂµes em andamento com um correspondente designado.");
        }
        if (currentMission.requesterId !== ctx.user.id && currentMission.correspondentId !== ctx.user.id) {
          throw new Error("VocÃƒÂª nÃƒÂ£o participa desta missÃƒÂ£o.");
        }

        const recipientId = currentMission.requesterId === ctx.user.id
          ? currentMission.correspondentId
          : currentMission.requesterId;

        const existing = await db
          .select({ id: missionAssistanceRequests.id })
          .from(missionAssistanceRequests)
          .where(
            and(
              eq(missionAssistanceRequests.missionId, input.missionId),
              eq(missionAssistanceRequests.requesterId, ctx.user.id),
              eq(missionAssistanceRequests.recipientId, recipientId),
              or(
                eq(missionAssistanceRequests.status, "pending"),
                eq(missionAssistanceRequests.status, "accepted"),
              ),
            ),
          )
          .limit(1);
        if (existing[0]) {
          throw new Error("VocÃƒÂª jÃƒÂ¡ possui um pedido de acompanhamento ativo para esta missÃƒÂ£o.");
        }

        const result = await db.insert(missionAssistanceRequests).values({
          missionId: input.missionId,
          requesterId: ctx.user.id,
          recipientId,
          note: input.note || null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }).returning({ id: missionAssistanceRequests.id });
        await db.insert(notifications).values({
          userId: recipientId,
          title: "Novo pedido de acompanhamento",
          body: "VocÃƒÂª recebeu um pedido de acompanhamento para revisar.",
          type: "assistance_request",
          relatedId: input.missionId,
        });
        void sendAssistancePush(recipientId, input.missionId, "request");
        return { id: Number(result[0].id), success: true };
      }),

    respond: protectedProcedure
      .input(
        z.object({
          requestId: z.number().int().positive(),
          decision: z.enum(["accepted", "declined"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const request = await db
          .select()
          .from(missionAssistanceRequests)
          .where(eq(missionAssistanceRequests.id, input.requestId))
          .limit(1);
        const currentRequest = request[0];
        if (!currentRequest || currentRequest.recipientId !== ctx.user.id) {
          throw new Error("Somente o destinatÃƒÂ¡rio pode responder a este pedido.");
        }
        if (!canRespondToAssistanceRequest(currentRequest.status, currentRequest.expiresAt, currentRequest.recipientId, ctx.user.id)) {
          throw new Error("Este pedido nÃƒÂ£o estÃƒÂ¡ mais disponÃƒÂ­vel para resposta.");
        }

        await db
          .update(missionAssistanceRequests)
          .set({ status: input.decision, respondedAt: new Date() })
          .where(eq(missionAssistanceRequests.id, input.requestId));
        await db.insert(notifications).values({
          userId: currentRequest.requesterId,
          title: "Acompanhamento atualizado",
          body: "HÃƒÂ¡ uma atualizaÃƒÂ§ÃƒÂ£o em um acompanhamento consentido.",
          type: "assistance_response",
          relatedId: currentRequest.missionId,
        });
        void sendAssistancePush(currentRequest.requesterId, currentRequest.missionId, "response");
        return { success: true };
      }),

    sendGuidance: protectedProcedure
      .input(
        z.object({
          requestId: z.number().int().positive(),
          content: z.string().trim().min(1, "Escreva uma orientaÃƒÂ§ÃƒÂ£o.").max(1000, "A orientaÃƒÂ§ÃƒÂ£o pode ter no mÃƒÂ¡ximo 1.000 caracteres."),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const request = await db
          .select()
          .from(missionAssistanceRequests)
          .where(eq(missionAssistanceRequests.id, input.requestId))
          .limit(1);
        const currentRequest = request[0];
        if (!currentRequest || !canSendAssistanceGuidance(currentRequest.status, currentRequest.recipientId, ctx.user.id)) {
          throw new Error("A orientaÃƒÂ§ÃƒÂ£o sÃƒÂ³ pode ser enviada pelo destinatÃƒÂ¡rio apÃƒÂ³s o aceite.");
        }

        const result = await db.insert(missionAssistanceGuidance).values({
          assistanceRequestId: input.requestId,
          senderId: ctx.user.id,
          content: input.content,
        }).returning({ id: missionAssistanceGuidance.id });
        await db.insert(notifications).values({
          userId: currentRequest.requesterId,
          title: "OrientaÃƒÂ§ÃƒÂ£o disponÃƒÂ­vel",
          body: "Uma nova orientaÃƒÂ§ÃƒÂ£o estÃƒÂ¡ disponÃƒÂ­vel no acompanhamento consentido.",
          type: "assistance_guidance",
          relatedId: currentRequest.missionId,
        });
        void sendAssistancePush(currentRequest.requesterId, currentRequest.missionId, "guidance");
        return { id: Number(result[0].id), success: true };
      }),

    close: protectedProcedure
      .input(z.object({ requestId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const request = await db
          .select()
          .from(missionAssistanceRequests)
          .where(eq(missionAssistanceRequests.id, input.requestId))
          .limit(1);
        const currentRequest = request[0];
        if (!currentRequest || !canCloseAssistanceRequest(currentRequest.status, currentRequest.requesterId, currentRequest.recipientId, ctx.user.id)) {
          throw new Error("Somente participantes podem encerrar um acompanhamento aceito.");
        }

        await db
          .update(missionAssistanceRequests)
          .set({ status: "closed", closedAt: new Date() })
          .where(eq(missionAssistanceRequests.id, input.requestId));
        return { success: true };
      }),
  }),

  push: router({
    registerDevice: protectedProcedure
      .input(z.object({
        expoPushToken: z.string().min(20).max(255),
        platform: z.enum(["android", "ios"]),
        deliveryMode: z.literal("remote"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db.select({ id: pushDevices.id })
          .from(pushDevices)
          .where(and(eq(pushDevices.userId, ctx.user.id), eq(pushDevices.expoPushToken, input.expoPushToken)))
          .limit(1);
        if (existing[0]) {
          await db.update(pushDevices).set({ platform: input.platform, deliveryMode: "remote", isActive: true })
            .where(eq(pushDevices.id, existing[0].id));
        } else {
          await db.insert(pushDevices).values({ userId: ctx.user.id, ...input, isActive: true });
        }
        return { success: true };
      }),
    setDeliveryMode: protectedProcedure
      .input(z.object({ deliveryMode: z.enum(["remote", "in_app"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(pushDevices).set({ deliveryMode: input.deliveryMode, isActive: input.deliveryMode === "remote" })
          .where(eq(pushDevices.userId, ctx.user.id));
        return { success: true };
      }),
  }),

  chat: router({
    getMessages: protectedProcedure
      .input(z.object({ missionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(chatMessages).where(eq(chatMessages.missionId, input.missionId)).orderBy(chatMessages.createdAt);
      }),

    sendMessage: protectedProcedure
      .input(z.object({ missionId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(chatMessages).values({
          missionId: input.missionId,
          senderId: ctx.user.id,
          content: input.content,
        }).returning({ id: chatMessages.id });
        // Notify the other party
        const mission = await db.select().from(missions).where(eq(missions.id, input.missionId)).limit(1);
        if (mission[0]) {
          const recipientId = mission[0].requesterId === ctx.user.id ? mission[0].correspondentId : mission[0].requesterId;
          if (recipientId) {
            await db.insert(notifications).values({
              userId: recipientId,
              title: "Nova mensagem",
              body: `VocÃƒÂª recebeu uma mensagem na missÃƒÂ£o: ${mission[0].title}`,
              type: "new_message",
              relatedId: input.missionId,
            });
          }
        }
        return { id: Number(result[0].id), success: true };
      }),
  }),

  custody: router({
    uploadPhoto: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string().default("image/jpeg") }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage.js");
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType === "image/png" ? "png" : "jpg";
        const key = `custody-photos/${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    getTimeline: protectedProcedure
      .input(z.object({ missionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(custodySteps).where(eq(custodySteps.missionId, input.missionId)).orderBy(custodySteps.createdAt);
      }),

    addStep: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          description: z.string().min(3),
          photoUrl: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          locationName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(custodySteps).values({
          missionId: input.missionId,
          correspondentId: ctx.user.id,
          description: input.description,
          photoUrl: input.photoUrl,
          latitude: input.latitude,
          longitude: input.longitude,
          locationName: input.locationName,
        }).returning({ id: custodySteps.id });
        return { id: Number(result[0].id), success: true };
      }),
  }),

  reviews: router({
    create: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          revieweeId: z.number(),
          reviewerRole: z.enum(["requester", "correspondent"]),
          rating: z.number().min(1).max(5),
          // Criteria for requester evaluating correspondent
          ratingPunctuality: z.number().min(1).max(5).optional(),
          ratingCommunication: z.number().min(1).max(5).optional(),
          ratingQuality: z.number().min(1).max(5).optional(),
          ratingProfessionalism: z.number().min(1).max(5).optional(),
          // Criteria for correspondent evaluating requester
          ratingClarity: z.number().min(1).max(5).optional(),
          ratingPayment: z.number().min(1).max(5).optional(),
          comment: z.string().max(1000).optional(),
          isPublic: z.boolean().optional().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Check if already reviewed this mission
        const existing = await db.select().from(reviews)
          .where(eq(reviews.missionId, input.missionId))
          .then(rows => rows.filter(r => r.reviewerId === ctx.user.id));
        if (existing.length > 0) throw new Error("VocÃƒÂª jÃƒÂ¡ avaliou esta missÃƒÂ£o.");
        await db.insert(reviews).values({
          missionId: input.missionId,
          reviewerId: ctx.user.id,
          revieweeId: input.revieweeId,
          reviewerRole: input.reviewerRole,
          rating: input.rating,
          ratingPunctuality: input.ratingPunctuality,
          ratingCommunication: input.ratingCommunication,
          ratingQuality: input.ratingQuality,
          ratingProfessionalism: input.ratingProfessionalism,
          ratingClarity: input.ratingClarity,
          ratingPayment: input.ratingPayment,
          comment: input.comment,
          isPublic: input.isPublic ?? true,
        });
        // Update average rating for reviewee
        const allReviews = await db.select().from(reviews).where(eq(reviews.revieweeId, input.revieweeId));
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await db.update(users).set({ averageRating: avg }).where(eq(users.id, input.revieweeId));
        // Update trust level for correspondent
        if (input.reviewerRole === "requester") {
          const total = await db.select().from(missions).where(eq(missions.correspondentId, input.revieweeId));
          const count = total.length;
          const trustLevel = count >= 50 ? "ambassador" : count >= 20 ? "elite" : count >= 5 ? "trusted" : "explorer";
          await db.update(users).set({ trustLevel }).where(eq(users.id, input.revieweeId));
        }
        await db.insert(notifications).values({
          userId: input.revieweeId,
          title: "Nova avaliaÃƒÂ§ÃƒÂ£o recebida",
          body: `VocÃƒÂª recebeu uma avaliaÃƒÂ§ÃƒÂ£o de ${input.rating} estrela${input.rating !== 1 ? 's' : ''}!`,
          type: "new_review",
          relatedId: input.missionId,
        });
        return { success: true };
      }),
    // Check if current user already reviewed a mission
    checkReviewed: protectedProcedure
      .input(z.object({ missionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { reviewed: false };
        const existing = await db.select().from(reviews)
          .where(eq(reviews.missionId, input.missionId))
          .then(rows => rows.filter(r => r.reviewerId === ctx.user.id));
        return { reviewed: existing.length > 0 };
      }),
    // Get all reviews for a mission (both sides)
    getForMission: publicProcedure
      .input(z.object({ missionId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(reviews).where(eq(reviews.missionId, input.missionId)).orderBy(desc(reviews.createdAt));
      }),
    getForUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(reviews).where(eq(reviews.revieweeId, input.userId)).orderBy(desc(reviews.createdAt));
      }),
    // Get pending reviews (missions completed but not yet reviewed by current user)
    getPending: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      // Missions completed where user was requester or correspondent
      const completedMissions = await db.select().from(missions)
        .where(eq(missions.status, "completed"))
        .then(rows => rows.filter(r => r.requesterId === ctx.user.id || r.correspondentId === ctx.user.id));
      // Filter out already reviewed
      const alreadyReviewed = await db.select().from(reviews)
        .where(eq(reviews.reviewerId, ctx.user.id))
        .then(rows => rows.map(r => r.missionId));
            return completedMissions.filter(m => !alreadyReviewed.includes(m.id));
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
      return { count: Number(result[0]?.count ?? 0) };
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (input.id) {
          await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
        } else {
          await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
        }
        return { success: true };
      }),
  }),

  support: router({
    createTicket: protectedProcedure
      .input(z.object({ subject: z.string().min(5), message: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const ticket = await db.insert(supportTickets).values({ userId: ctx.user.id, subject: input.subject }).returning({ id: supportTickets.id });
        const ticketId = Number(ticket[0].id);
        await db.insert(supportMessages).values({ ticketId, senderId: ctx.user.id, content: input.message });
        return { id: ticketId, success: true };
      }),

    myTickets: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(supportTickets).where(eq(supportTickets.userId, ctx.user.id)).orderBy(desc(supportTickets.createdAt));
    }),

    getMessages: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(supportMessages).where(eq(supportMessages.ticketId, input.ticketId)).orderBy(supportMessages.createdAt);
      }),

    addMessage: protectedProcedure
      .input(z.object({ ticketId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(supportMessages).values({ ticketId: input.ticketId, senderId: ctx.user.id, content: input.content }).returning({ id: supportMessages.id });
        return { id: Number(result[0].id), success: true };
      }),
  }),

  // ── Service Categories ────────────────────────────────────────────────
  categories: router({
    // List all approved categories (built-in + user-created)
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(serviceCategories).where(eq(serviceCategories.isApproved, true)).orderBy(serviceCategories.isBuiltIn, serviceCategories.name);
    }),

    // List pending user-proposed categories (admin use)
    listPending: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(serviceCategories).where(eq(serviceCategories.isApproved, false)).orderBy(desc(serviceCategories.createdAt));
    }),

    // Propose a new custom category
    propose: protectedProcedure
      .input(z.object({
        name: z.string().min(3).max(128),
        description: z.string().min(10).max(500),
        icon: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Generate slug from name
        const slug = input.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 64);
        // Check for duplicate slug
        const existing = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug));
        if (existing.length > 0) {
          throw new Error("Uma categoria com este nome jÃƒÂ¡ existe.");
        }
        const result = await db.insert(serviceCategories).values({
          slug,
          name: input.name,
          description: input.description,
          icon: input.icon ?? "briefcase",
          isBuiltIn: false,
          isApproved: true, // auto-approve for now; can add moderation later
          createdBy: ctx.user.id,
        }).returning({ id: serviceCategories.id });
        return { id: Number(result[0].id), slug, name: input.name, success: true };
      }),

    // Approve a pending category (admin)
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(serviceCategories).set({ isApproved: true }).where(eq(serviceCategories.id, input.id));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
