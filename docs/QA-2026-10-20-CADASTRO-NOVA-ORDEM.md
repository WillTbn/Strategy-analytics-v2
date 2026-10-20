# Cadastro — nova ordem autorizada pelo designer e QA, 20/10/2026

## Ordem vigente

1. Criar conta.
2. Confirmar e-mail.
3. Dados pessoais.
4. Atividade trabalhista e moedas.
5. Documento e endereço, conforme o país.
6. Contatos de confiança.
7. Revisão e envio.

O usuário confirmou a autorização do designer/QA para antecipar os dados profissionais e aprovou explicitamente os quatro campos: Ocupação, Empregador (opcional), Moeda principal e Moeda secundária. Esta revisão autorizada substitui a sequência anterior das etapas 4/5; composição, assets, inputs, cores e ações Voltar/Continuar foram reutilizados.

## Campos e envio da etapa 4

Ocupação (obrigatória, texto livre aceito pelo contrato), Empregador opcional e os três valores financeiros existentes: renda individual, renda familiar e bens. Duas moedas obrigatórias, escolhidas no catálogo real da API; não existem defaults fictícios de ocupação/moeda. Nenhum campo de vigência/status/ID técnico acrescentado.

Continuar valida os dados e somente avança depois de concluir:

1. PUT /client/profile/professional-profile — occupation e employerName; preserva metadados existentes, usa data atual/isCurrent para perfil novo.
2. PUT /client/profile/financial-profile — preserva precisão, ausência e zero, vigência e BRL dos campos; não converte outra moeda silenciosamente.
3. PATCH /client/profile/preferences — salva ambas as moedas e preserva país/idioma/fuso/tema existentes.

Falha preserva o rascunho e mantém a etapa. Retry do mesmo payload não repete as partes já confirmadas nesta tentativa; payload alterado pode ser enviado novamente. Campos financeiros vazios permanecem null, sem inventar renda zero; criação do registro financeiro é feita mesmo sem valores opcionais.

## Navegação e compatibilidade

Etapa 4 em /cadastro/etapa-4; documentos em /cadastro/etapa-5/:variant?. Voltar/Continuar e Editar na revisão ajustados. Antigos links /cadastro/etapa-4/:variant redirecionam para documentos na etapa 5. Marcadores anteriores de retomada são migrados por usuário: documentos 4 → 5 e trabalho 5 → 4. Rota documental exige registros profissional/financeiro e moedas preenchidas; ausência confirmada retorna à etapa 4. Falha de consulta não é interpretada como ausência.

## Validação do lote

152 testes, lint/build e diff do lote aprovados. Testes cobrem a sequência dos três endpoints, criação de profissional/financeiro, preservação de metadados, opcionalidade do empregador, ambas as moedas, falha/retry sem duplicar partes confirmadas, guard documental, migração de retomada e links/campos da revisão.

Navegador local 9010: composição dos sete campos conferida com dados existentes; ocupação vazia rejeitada com foco, sem escrita. Editar Atividade trabalhista na revisão abriu a nova etapa 4. Desktop e viewport real de 390 px sem overflow; aba original documental preservada. Reteste integrado/publicação registrado no checklist central após deploy.

## Causa do 403 e limites

O backend confirmou ProfileIncomplete pela ausência de registro profissional na conta nova; a ordem anterior tentava documentos antes de criá-lo. Isso foi tratado como regra de negócio e ajuste de sequência, não como autorização para remover o guard. Moedas vazias também são tratadas na nova etapa 4.

Continuam pendentes os demais contratos: campos pessoais/bairro/catálogos ainda não disponíveis, contatos sem relationship/ausência persistida, termos e aceite versionado, progresso entre dispositivos e envio/revisão final. Este lote não comprova upload ou cadastro enviado para análise. Cadastro profissional usa string, portanto não depende mais de catálogo de ocupações.
