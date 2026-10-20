# QA — retomada do cadastro após novo login, 20/10/2026

## Correção do front

O login e o acesso à página Login com sessão válida passam a respeitar a última etapa autenticada visitada na mesma origem/navegador. Navegações concluídas das etapas 3–7 registram somente a rota (e a variante existente da etapa 4) em chave separada por ID do usuário autenticado. Home/logout não apagam o marcador. Navegação cancelada, anônima, enviado e URLs fora do cadastro não gravam progresso. Um retorno explícito válido da tela de login continua tendo prioridade; confirmação inicial continua abrindo etapa 3.

Somente rotas existentes são aceitas, com variante restrita à etapa 4 e aos nomes do desenho. Valores corrompidos, URL externa/query, ausência de usuário e storage indisponível falham com segurança. Conta sem marcador abre Home. O marcador não contém campos do formulário, e-mail, senha, código, token, documentos, arquivos ou confirmação legal; não aprova etapas nem altera permissões.

Após novo login, os dados suportados voltam da API. Corrigida a hidratação para descartar rascunhos da sessão anterior mesmo quando é o mesmo cliente, preservando a renovação normal de token. Uma etapa ainda aberta em uma sessão antiga não pode gravar após novo login sem recarregar os dados. Nenhum campo, ação, texto de tela, composição ou CSS do Figma alterado.

## Verificações

- 145 testes aprovados, incluindo dez novos cenários: rotas seguras, contas separadas, exclusão de navegações inválidas, storage indisponível/corrompido, autenticação real com logout/novo login e outra conta, hooks reais do router/navegação cancelada/sessão expirada, hidratação da mesma conta e bloqueio de escrita antiga.
- Lint, build e diff do lote aprovados.
- Local 9010 no Edge: Cláudio entrou sem marcador na Home, abriu etapa 5, voltou à Home, saiu pela ação existente e fez novo login em /login sem next. Retornou automaticamente à etapa 5 com atividade e valores da API (12.000; 18.000; 450.000).
- Em seguida, logout e login de Éric abriram a Home; ele não herdou a etapa 5 do Cláudio. Nenhum cadastro/documento ou operação financeira foi gravado.
- Testes em navegador separado preservam a aba original do usuário no navegador integrado com documentos ainda não enviados.

## Limites reais

GET /client/onboarding/status foi conferido no OpenAPI atual: retorna requisitos/features e flags de perfil/documentos, mas não etapa atual, rascunho por etapa ou confirmação de envio/revisão. Não é seguro inferir término do cadastro dessas flags.

Esta solução retoma a rota no mesmo navegador/origem enquanto seu armazenamento for mantido; não sincroniza progresso entre dispositivos nem recupera etapas anteriores à instalação da correção sem marcador. Campos não gravados e arquivos selecionados não são persistidos em storage. Persistência automática de todo o rascunho, progresso no servidor e encerramento do fluxo após envio confirmado ainda precisam de contrato/alinhamento do backend. Não foi inventado autosave de campos fora das escritas já existentes em Continuar.

403 documental, catálogos, bairro, contatos novos/ausência, aceite e envio final continuam pendentes no checklist central. Recuperação de documentos já enviados precisa de reteste integrado após liberação; nenhum upload foi homologado neste lote.
