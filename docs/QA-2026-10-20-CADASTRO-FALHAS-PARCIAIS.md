# QA — revisão do cadastro e falhas parciais, 20/10/2026

## Problema e correção

Ao abrir a etapa 7 com consulta profissional/financeira ou de contatos falhando antes da primeira hidratação, o front podia substituir o rascunho por valores vazios. Uma falha profissional também impedia marcar como carregados os valores financeiros recebidos corretamente; nova tentativa podia sobrescrever edições locais.

Cada resposta agora é hidratada somente após sucesso e de forma independente. Falhas preservam os rascunhos, são agregadas no aviso existente e indicadas na própria linha do resumo. Não informado continua reservado à ausência de dados após leitura bem-sucedida. Uma nova consulta bem-sucedida limpa o aviso de leitura sem sobrescrever grupos já hidratados. Nas etapas de edição 5/6 a falha de leitura continua bloqueando a edição sem apagar o estado.

Nenhum campo, ação, grupo, asset ou CSS foi acrescentado; cinco grupos e Editar do Figma preservados. Nenhum contrato HTTP alterado. Rascunhos continuam somente em memória, sem promessa de persistência após recarga.

## Validação

- 126 testes aprovados, incluindo quatro novos cenários do composable real com serviços simulados: sucesso financeiro/falha profissional, falhas simultâneas preservando rascunhos, recuperação sem sobrescrever edição e bloqueio seguro da etapa 5. Teste adicional da apresentação impede confundir falha com Não informado e preserva zero real.
- Lint, build e diff do lote aprovados.
- Navegador local 9010: revisão desktop conferida e viewport efetivo de 390 px verificado. Cinco linhas, textos e Editar sem overflow horizontal; rodapé dentro da tela.
- Enviar sem confirmação: erro e foco no checkbox, sem envio nem alteração cadastral. Não foi marcada a confirmação, nem provocada falha no servidor. Testes de falha são automatizados, não evidência de falha nova do backend.
- Aba original do usuário com rascunho documental preservada; teste visual em aba separada. Viewport restaurado ao final.

## Limites

Não homologa upload, contatos novos, aceite versionado, envio para análise nem progresso integral. Permanecem os bloqueios reais do checklist central. Consulta CEP e retomada da etapa após novo login ainda exigem trabalho/conferência do front. Atualizada a triagem para não repetir a situação histórica de telas sem integração.
