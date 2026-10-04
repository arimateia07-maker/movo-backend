import type { Express } from "express";

const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade — Movo</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#374151;line-height:1.6}
    .container{max-width:800px;margin:0 auto;padding:32px 24px 64px}
    h1{font-size:28px;font-weight:700;color:#11181C;margin-bottom:4px}
    .subtitle{font-size:13px;color:#687076;margin-bottom:40px}
    h2{font-size:18px;font-weight:700;color:#0a7ea4;margin-top:32px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E5E7EB}
    h3{font-size:15px;font-weight:600;color:#11181C;margin-top:16px;margin-bottom:8px}
    p{font-size:14px;margin-bottom:10px}
    ul{padding-left:20px;margin-bottom:10px}
    li{font-size:14px;margin-bottom:6px}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px}
    th,td{text-align:left;padding:8px;border-bottom:1px solid #F3F4F6}
    th{font-weight:600;color:#11181C;width:35%}
    td{color:#374151}
    .footer{margin-top:40px;font-size:13px;color:#687076;text-align:center;font-style:italic}
    a{color:#0a7ea4}
  </style>
</head>
<body>
<div class="container">
  <h1>Política de Privacidade — Movo</h1>
  <p class="subtitle">Última atualização: 16 de julho de 2026</p>

  <h2>1. Introdução</h2>
  <p>A Movo é um marketplace de missões presenciais que conecta pessoas que precisam de serviços realizados pessoalmente ("Solicitantes") a profissionais verificados que os executam ("Correspondentes"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos as informações pessoais dos usuários do aplicativo Movo, disponível para dispositivos Android e iOS.</p>
  <p>Ao criar uma conta ou utilizar o aplicativo, você declara ter lido, compreendido e concordado com esta Política de Privacidade e com os Termos de Uso. Caso não concorde com qualquer uma dessas condições, não utilize o aplicativo.</p>

  <h2>2. Dados que Coletamos</h2>
  <h3>2.1 Dados fornecidos diretamente por você</h3>
  <table>
    <tr><th>Dado</th><th>Finalidade</th></tr>
    <tr><td>Nome completo</td><td>Identificação na plataforma e exibição no perfil</td></tr>
    <tr><td>Endereço de e-mail</td><td>Autenticação, comunicações e recuperação de conta</td></tr>
    <tr><td>Número de telefone</td><td>Autenticação via SMS (opcional)</td></tr>
    <tr><td>Senha (hash bcrypt)</td><td>Autenticação segura na plataforma</td></tr>
    <tr><td>Foto de perfil</td><td>Exibição no perfil público</td></tr>
    <tr><td>Tipo de usuário</td><td>Personalização da experiência</td></tr>
    <tr><td>Biografia e informações profissionais</td><td>Exibição no perfil público</td></tr>
    <tr><td>Dados de localização da missão</td><td>Execução e rastreamento das missões</td></tr>
  </table>
  <h3>2.2 Dados gerados pelo uso do aplicativo</h3>
  <ul>
    <li>Missões criadas e executadas: título, descrição, categoria, urgência, orçamento, status e histórico.</li>
    <li>Mensagens de chat entre Solicitantes e Correspondentes relacionadas a missões.</li>
    <li>Linha do tempo de custódia: fotos, descrições e coordenadas geográficas durante a execução.</li>
    <li>Avaliações e reputação: notas, critérios e comentários públicos ou anônimos.</li>
    <li>Notificações: registro de notificações enviadas e lidas.</li>
    <li>Tickets de suporte: assunto, mensagens e histórico de atendimento.</li>
    <li>Dados de acesso: IP, tipo de dispositivo, SO, versão do app e data/hora de acesso.</li>
  </ul>
  <h3>2.3 Dados coletados automaticamente</h3>
  <ul>
    <li>Dados de desempenho e erros: logs anônimos de falhas para melhoria do aplicativo.</li>
  </ul>

  <h2>3. Como Usamos seus Dados</h2>
  <p>Utilizamos as informações coletadas para as seguintes finalidades:</p>
  <ul>
    <li><strong>Prestação do serviço:</strong> criar e gerenciar sua conta, processar missões, facilitar a comunicação entre usuários e enviar notificações.</li>
    <li><strong>Segurança e verificação:</strong> verificar identidade, prevenir fraudes e detectar atividades suspeitas.</li>
    <li><strong>Melhoria do produto:</strong> analisar padrões de uso de forma agregada e anônima.</li>
    <li><strong>Comunicação:</strong> enviar notificações sobre atividades relevantes e atualizações de segurança.</li>
    <li><strong>Cumprimento de obrigações legais:</strong> atender requisições de autoridades competentes.</li>
  </ul>

  <h2>4. Compartilhamento de Dados</h2>
  <p>A Movo não vende suas informações pessoais a terceiros. Podemos compartilhar dados nas seguintes situações:</p>
  <ul>
    <li><strong>Entre usuários:</strong> informações de perfil são visíveis a outros usuários para viabilizar a contratação de missões.</li>
    <li><strong>Prestadores de serviço:</strong> terceiros contratados para hospedagem, armazenamento e análise, obrigados contratualmente a proteger seus dados.</li>
    <li><strong>Obrigações legais:</strong> quando exigido por lei, ordem judicial ou autoridade governamental competente.</li>
    <li><strong>Transferência corporativa:</strong> em caso de fusão ou aquisição, seus dados poderão ser transferidos ao novo controlador.</li>
  </ul>

  <h2>5. Armazenamento e Segurança</h2>
  <ul>
    <li>Senhas armazenadas exclusivamente como hash irreversível (bcrypt)</li>
    <li>Sessões autenticadas via token JWT com prazo de validade</li>
    <li>Credenciais biométricas armazenadas no SecureStore do dispositivo (nunca enviadas ao servidor)</li>
    <li>Comunicações protegidas por HTTPS/TLS</li>
    <li>Acesso restrito ao banco de dados por credenciais e controle de acesso baseado em função</li>
  </ul>

  <h2>6. Retenção de Dados</h2>
  <table>
    <tr><th>Tipo de dado</th><th>Prazo de retenção</th></tr>
    <tr><td>Dados de conta ativa</td><td>Enquanto a conta estiver ativa</td></tr>
    <tr><td>Histórico de missões</td><td>5 anos após a conclusão</td></tr>
    <tr><td>Mensagens de chat</td><td>2 anos após o encerramento da missão</td></tr>
    <tr><td>Dados de suporte</td><td>3 anos após o encerramento do ticket</td></tr>
    <tr><td>Logs de acesso</td><td>6 meses</td></tr>
    <tr><td>Dados após exclusão de conta</td><td>Até 30 dias para exclusão definitiva</td></tr>
  </table>

  <h2>7. Seus Direitos (LGPD)</h2>
  <p>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:</p>
  <ul>
    <li>Confirmação e acesso aos seus dados pessoais</li>
    <li>Correção de dados incompletos, inexatos ou desatualizados</li>
    <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
    <li>Portabilidade dos dados em formato estruturado</li>
    <li>Eliminação dos dados tratados com base no seu consentimento</li>
    <li>Revogação do consentimento a qualquer momento</li>
    <li>Revisão de decisões tomadas exclusivamente por tratamento automatizado</li>
  </ul>

  <h2>8. Exclusão de Conta e Dados</h2>
  <p>Você pode solicitar a exclusão da sua conta e de todos os seus dados pessoais a qualquer momento. Para isso:</p>
  <ul>
    <li>Acesse as configurações do aplicativo e selecione "Excluir minha conta", ou</li>
    <li>Envie um e-mail para <a href="mailto:movodespachante@gmail.com">movodespachante@gmail.com</a> com o assunto "Solicitação de Exclusão de Conta"</li>
  </ul>
  <p>Após a solicitação, sua conta será desativada imediatamente e todos os dados pessoais serão excluídos permanentemente em até 30 dias, exceto dados que devemos reter por obrigação legal.</p>
  <p>Para mais detalhes, acesse: <a href="/excluir-conta">Página de Exclusão de Conta</a></p>

  <h2>9. Crianças e Adolescentes</h2>
  <p>O aplicativo Movo é destinado exclusivamente a usuários com 18 anos ou mais. Não coletamos intencionalmente dados de menores de idade.</p>

  <h2>10. Alterações nesta Política</h2>
  <p>Podemos atualizar esta Política periodicamente. Quando realizarmos alterações relevantes, notificaremos você por meio do aplicativo ou por e-mail com pelo menos 15 dias de antecedência.</p>

  <h2>11. Contato e DPO</h2>
  <p>Para dúvidas, solicitações de direitos ou reclamações:</p>
  <p><strong>Movo — Plataforma de Missões Presenciais</strong><br>
  E-mail: <a href="mailto:movodespachante@gmail.com">movodespachante@gmail.com</a><br>
  Responderemos em até 15 dias úteis.</p>
  <p>Você também pode registrar reclamações junto à ANPD: <a href="https://www.gov.br/anpd" target="_blank">www.gov.br/anpd</a></p>

  <h2>12. Lei Aplicável e Foro</h2>
  <p>Esta Política é regida pelas leis da República Federativa do Brasil, em especial pela LGPD (Lei nº 13.709/2018) e pelo Marco Civil da Internet (Lei nº 12.965/2014).</p>

  <p class="footer">Movo — Conectando pessoas a quem pode ajudar, presencialmente.</p>
</div>
</body>
</html>`;

const ACCOUNT_DELETION_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusão de Conta — Movo</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#374151;line-height:1.6}
    .container{max-width:800px;margin:0 auto;padding:32px 24px 64px}
    h1{font-size:28px;font-weight:700;color:#11181C;margin-bottom:4px}
    .subtitle{font-size:13px;color:#687076;margin-bottom:40px}
    h2{font-size:18px;font-weight:700;color:#0a7ea4;margin-top:32px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E5E7EB}
    p{font-size:14px;margin-bottom:10px}
    ul,ol{padding-left:20px;margin-bottom:10px}
    li{font-size:14px;margin-bottom:8px}
    .card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin:24px 0}
    .btn{display:inline-block;background:#0a7ea4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px}
    .warning{background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:16px 0;font-size:14px}
    a{color:#0a7ea4}
    .footer{margin-top:40px;font-size:13px;color:#687076;text-align:center;font-style:italic}
  </style>
</head>
<body>
<div class="container">
  <h1>Exclusão de Conta — Movo</h1>
  <p class="subtitle">Gerencie sua conta e seus dados pessoais</p>

  <h2>Como excluir sua conta</h2>
  <p>Você pode solicitar a exclusão da sua conta Movo de duas formas:</p>

  <div class="card">
    <h2 style="border:none;margin-top:0">Opção 1: Pelo aplicativo</h2>
    <ol>
      <li>Abra o aplicativo Movo</li>
      <li>Acesse a aba <strong>Perfil</strong></li>
      <li>Toque em <strong>Configurações</strong></li>
      <li>Selecione <strong>Excluir minha conta</strong></li>
      <li>Confirme a exclusão</li>
    </ol>
  </div>

  <div class="card">
    <h2 style="border:none;margin-top:0">Opção 2: Por e-mail</h2>
    <p>Envie um e-mail para nossa equipe de suporte com o assunto <strong>"Solicitação de Exclusão de Conta"</strong>:</p>
    <p style="margin-top:12px">
      <a href="mailto:movodespachante@gmail.com?subject=Solicitação de Exclusão de Conta" class="btn">Enviar e-mail de exclusão</a>
    </p>
    <p style="margin-top:12px;font-size:13px;color:#687076">Responderemos em até 15 dias úteis.</p>
  </div>

  <h2>O que acontece quando você exclui sua conta</h2>
  <div class="warning">
    <strong>Atenção:</strong> A exclusão de conta é permanente e irreversível.
  </div>
  <ul>
    <li>Sua conta será desativada imediatamente</li>
    <li>Todos os seus dados pessoais serão excluídos permanentemente em até 30 dias</li>
    <li>Missões em andamento serão canceladas</li>
    <li>Seu histórico de avaliações será removido</li>
    <li>Dados que devemos reter por obrigação legal serão mantidos pelo prazo mínimo exigido</li>
  </ul>

  <h2>Exclusão parcial de dados</h2>
  <p>Se preferir excluir apenas alguns dados sem encerrar sua conta, entre em contato:</p>
  <p><a href="mailto:movodespachante@gmail.com">movodespachante@gmail.com</a></p>

  <h2>Contato</h2>
  <p><strong>Movo — Plataforma de Missões Presenciais</strong><br>
  E-mail: <a href="mailto:movodespachante@gmail.com">movodespachante@gmail.com</a><br>
  Responderemos em até 15 dias úteis.</p>

  <p class="footer">Movo — Conectando pessoas a quem pode ajudar, presencialmente.</p>
</div>
</body>
</html>`;

export function registerLegalRoutes(app: Express): void {
  // Política de Privacidade — exigida pelo Google Play Console
  // Nota: o proxy da Manus só encaminha rotas /api/* para o servidor Express
  app.get("/api/privacidade", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(PRIVACY_POLICY_HTML);
  });

  // Exclusão de conta — exigida pelo Google Play Console (segurança dos dados)
  app.get("/api/excluir-conta", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(ACCOUNT_DELETION_HTML);
  });

  // Exclusão de dados — redireciona para exclusão de conta
  app.get("/api/excluir-dados", (_req, res) => {
    res.redirect(301, "/api/excluir-conta");
  });
}
