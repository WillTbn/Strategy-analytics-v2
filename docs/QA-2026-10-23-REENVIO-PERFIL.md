# QA — Reenvio pelo upload do perfil — 23/10/2026

Conta fictícia: client@example.com. Nenhum documento pessoal real ou dado da conta do usuário utilizado.

## Primeiro teste em homologação

- Controle existente Upload de arquivo de um RG antigo rejeitado abriu Substituir documento. Arquivo PNG marcado FICTÍCIO/SEM VALIDADE escolhido pelo seletor do navegador e enviado. A tela confirmou envio e exibiu o novo arquivo.
- Backend preservou o lado Back e vínculo ao provided-document antigo 60c4c5da-716d-48f2-91df-ecd176b9df8e. Novo arquivo 7f1824b2-5502-4799-8f00-904e77364dd7. O provided-document atual é b532bff0-eac0-437c-b557-0bddc15fc091, que mantinha os dois arquivos Approved.
- Apesar disso, progresso passou de 100% para 0% e submission voltou para UnderReview/lock=true. A consulta do perfil manteve a identificação atual com evidências aprovadas. Solicitar ao backend que desconsidere/bloqueie substituição de identificação histórica no cálculo e no estado de onboarding. Não mascarar no front a porcentagem real devolvida pela API.

## Correções do front

- [x] Leitura de files do overview preserva IDs, lados e vínculos de cada arquivo. Frente e verso ficam sob uma única identificação na tabela existente, sem criar colunas/campos/ações.
- [x] Identificações antigas divergentes do documento atual retornado pelo perfil deixam de oferecer reenvio. Seus arquivos não reaparecem como anexos soltos nem por requisitos de progresso antigos. Outros anexos legítimos são preservados.
- [x] Antes de substituir uma evidência vinculada, reconsultar perfil e overview; impedir envio se a identificação mudou ou o arquivo já foi aprovado. Erro mantém o arquivo selecionado e o diálogo existente.
- [x] 288 testes, lint e build aprovados. Testes cobrem lados, histórico, obrigação alternativa, preflight e preservação do rascunho.
- [ ] Publicação e validação visual em homologação.
- [ ] Reenvio dos dois lados atuais pelo upload do perfil, conferência de metadados, aprovação e nova consulta.

Preparação do segundo teste: revisão administrativa via API reprova somente o RG fictício atual (resposta 201). A rodada anterior já homologou a ação de reprovação pela tela do Admin. Os próximos uploads deverão ser feitos pelo navegador da Área do Cliente.
