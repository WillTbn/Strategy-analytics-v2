# Cadastro — Etapa 2: Confirmar e-mail

Conferência de 20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv, nó 4:25620.

## Entrega local

Tela 2/7 com e-mail mascarado herdado por propriedade, um único campo Código recebido, Solicitar novo código, Voltar e Confirmar e-mail. Estrutura, logo e seta locais da etapa 1 reutilizados; dimensões/gradientes próprios do nó 2 preservados. Nenhum campo de e-mail, senha ou ação de login foi acrescentado à nova tela.

A lógica extraída de ConfirmEmailPage é compartilhada com a nova composição. Usa os serviços existentes em clientAccountService, clientApi e seus interceptors. A confirmação pública permanece no fluxo atual com sua interface anterior. Sucesso exige succeeded === true; reenvio exige accepted === true. Código continua string sem limite arbitrário de seis dígitos. Nenhum token/sessão é inventado.

Proteções: pedidos concorrentes bloqueados, limites/Retry-After tratados, cronômetro por tempo decorrido, descarte de respostas após troca de e-mail/desmontagem, código limpo ao concluir/sair e temporizadores encerrados. Mensagens locais não reproduzem dados privados retornados pelo servidor.

## Validação

- 70 testes passaram: 11 da confirmação, além da suíte anterior e do isolamento das duas rotas dev.
- Confirmados código vazio, inválido, expirado, já usado, flags de sucesso, código alfanumérico sem truncamento, confirmação/reenvio concorrentes, limites e expiração, troca de contexto e resposta tardia.
- Teste de regressão para vinculação dos timers do navegador; erro encontrado no retorno visual corrigido e Voltar retestado abrindo Criar conta.
- Lint, build e git diff --check aprovados. Prévia excluída do build de produção.
- Desktop e celular (390 × 844) conferidos sem overflow horizontal. Código obrigatório recebe foco. Confirmar/reenvio na prévia foram bloqueados, sem sucesso fictício.
- Confirmação pública retestada com campos vazios: erro obrigatório e foco no e-mail, sem solicitação HTTP.

Prévia: http://localhost:9010/dev/cadastro/etapa-2. Banner explícito, endereço demonstrativo e adaptador que recusa envio/validação. O retorno leva à etapa 1; isso não representa persistência integrada das etapas.

## Pendências

Confirmação real de envio/recebimento, sessão e progresso para etapa 3 ainda não homologados. A resposta documentada de confirmação fornece somente succeeded/message; não autentica o próximo fluxo. Nenhum e-mail real foi enviado e nenhum cadastro foi criado nesta rodada. O cadastro integrado atual permanece preservado até resolver os contratos da etapa 1 e a continuidade por etapas.

Checklist e pendências consolidados no Admin: docs/CHECKLIST-CADASTRO-SETE-ETAPAS.md e docs/PENDENCIAS-BACKEND-QA.md. Próxima tela incremental: etapa 3.
