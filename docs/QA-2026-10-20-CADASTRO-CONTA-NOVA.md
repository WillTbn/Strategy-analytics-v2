# Cadastro — teste acompanhado de conta nova

20/10/2026, hml.strategyanalytics.com.br, portal b163763. Figma e componentes existentes preservados; nenhum campo ou ação adicional. E-mail completo, senha, código e identificadores pessoais omitidos. Usuário autorizou dados fictícios e nenhum documento pessoal real.

## Criação e sessão

Criação da conta e recebimento do código confirmados pelo usuário. Na retomada, etapa 3 estava autenticada. Consulta administrativa somente leitura encontrou o cliente correspondente e confirmou nascimento gravado pelo portal. Nenhuma senha foi solicitada ao usuário nesta rodada nem houve bypass/alteração de permissões pelo Admin.

## Dados pessoais

Calendário impossível rejeitado com erro/foco. Nascimento 01/01/1990 e Cidade Teste QA gravados; recarga da etapa 3 manteve ambos. Gênero, estado civil e nacionalidade exibiram Opções ainda indisponíveis. País de nascimento tinha Brazil/Portugal; seleção Brazil ficou somente no rascunho e desapareceu após recarga, conforme ausência desse campo no contrato HTTP. Não foram inventadas listas nem mapeamentos de nacionalidade.

## Endereço e documentos

Dados explicitamente fictícios: Rua Fictícia de Homologação, número 100, Unidade de teste, Bairro Teste QA, Cidade Teste QA e CEP 00000-000. Documento de rascunho QA-TESTE-0001, emissor TESTE QA, filiação Pessoa Fictícia QA 1/2. Sem CPF e sem arquivo pessoal. Estado/UF não tinham opções; consulta de CEP apenas mostrou aviso local, sem chamada postal.

PATCH de endereço/filiação persistiu. Leitura do Admin confirmou endereço residencial e país definido; a própria etapa 4 retomou filiação após recarga. Na sequência, GET /client/profile/document-types recebeu 403, traduzido pela mensagem existente; repetição manteve negativa. Nenhum upload ou gravação de dados documentais foi atingido. Não foi presumido blockingCode; dados de correlação não estão na mensagem do front. O backend deve esclarecer/liberar o requisito correto no fluxo novo, preservando autorização.

Ao retomar, Número voltou concatenado ao Logradouro em line1 e o campo Número ficou vazio: ajuste de adaptação do front identificado e não aprovado. Bairro também não voltou; inexiste campo separado no payload. Não confundir as duas situações nem registrar o ajuste do front como erro do backend.

## Etapas independentes após bloqueio

Fluxo normal interrompido na etapa 4. Rotas 5–7 foram abertas separadamente, com a mesma sessão cliente e sem manipular permissões ou declarar etapas concluídas no servidor.

- Financeiro: negativo rejeitado com foco; 1.234,56 individual, 2.345,67 familiar e zero de bens gravados em BRL. Consulta administrativa somente leitura e revisão após recarga confirmaram os valores. Atividade sem opções; perfil profissional não homologado.
- Contatos: vazio/incompleto validado localmente; contato fictício preservado, sem POST porque relationship obrigatório não pode ser deduzido de nome/telefone. Ausência local abriu revisão com aviso de não persistência; após recarga a seção voltou Não informado. Nenhum contato criado/excluído.
- Revisão: cinco grupos e Editar do Figma, dados suportados recuperados, documentos não enviados não apresentados como concluídos. Enviar sem confirmação mostrou erro/foco. Confirmação local da fixture de teste e ação final somente consultaram status e exibiram a pendência real de integração; não houve submissão nem atestado persistido. Nenhum recibo, aprovação, bloqueio/liberação ou estado em análise foi fabricado. Recarga desmarcou confirmação.

## Resultado

Aprovados os cenários observados de criação/código/sessão, nascimento/cidade, gravação de endereço/filiação e financeiro novo, com os limites acima. Cadastro de ponta a ponta não aprovado. Pendências para backend: guard documental 403; catálogos; país de nascimento/nacionalidades; bairro; contatos/ausência; envio final/revisão e aceite versionado. Ajuste do front: retomada separada do Número.

Dados sintéticos persistidos ficaram na conta para reteste, conforme autorização. Não houve arquivo pessoal, depósito, saque, transferência, aprovação de documento ou criação de nova conta pela automação. Checklists e pendências do Admin atualizados; credenciais/código/e-mail integral não foram commitados.
