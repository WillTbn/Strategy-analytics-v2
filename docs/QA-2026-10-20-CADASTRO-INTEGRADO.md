# Cadastro — integração dos endpoints existentes

20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv; componentes e assets das sete telas preservados. Substitui o estado de prévia dos relatórios anteriores; não declara o cadastro completo homologado.

## Operações conectadas

- /register abre /cadastro/etapa-1. POST /auth/register recebe somente name/email/password/referralCode, com chave estável na repetição ambígua. Nenhum aceite ou residência é fingido como parte desse payload.
- Etapa 2 usa confirmação e reenvio públicos existentes. Após confirmação, reutiliza login, verificação de identidade, cookies/interceptors e acesso de cliente; segue à etapa 3. Senha só em memória temporária entre 1–2, limpa na confirmação/saída; após recarga, o login existente permite retomar as etapas autenticadas. Não há senha/código/dados pessoais em URL ou storage novo.
- Etapa 3 consulta e salva o perfil; datas em ISO e somente campos suportados. Mantém nomes/contatos/endereços secundários, filiação e campos não editados. Catálogo de países usa IDs reais. Residência singular escolhida na conta pode preencher país ausente das preferências pelo catálogo, preservando os demais valores; agrupamentos regionais não viram um país inventado.
- Etapa 4 salva endereço e filiação, consulta tipos e definições e usa provided-documents e upload multipart. CPF/RG BR mapeados aos códigos reais e campos da definição; passaporte só quando houver código correspondente. Campos obrigatórios da definição validam antes do upload; arquivo concluído é reaproveitado no retry, separado por cliente. Correspondências não disponíveis param com mensagem. Endereço salvo não é apresentado como documento enviado.
- Etapa 5 consulta/grava perfil profissional e financeiro; mantém empregador/vigências existentes, usa data de criação ao iniciar novo registro e BRL do desenho. Valor vazio continua nulo; zero é explícito; sem conversão silenciosa de perfil existente em outra moeda. Falha não avança e conserva rascunho.
- Etapa 6 lista e atualiza existentes pelo ID, preservando relationship/e-mail reais. Todos os contatos são validados antes das escritas; contato novo sem relationship não gera POST inventado. Ausência com lista existente não exclui nada; com lista vazia é apenas declaração local e assim é informada na revisão.
- Etapa 7 carrega perfil/documentos tipados mascarados, financeiro/profissional e contatos. Mantém Editar e retorno por seção. Enviar consulta status real e informa ausência de operação final confirmada, sem navegar à referência de sucesso ou alterar status.

## Evidências

- OpenAPI atual consultado em /openapi/v1.json. GET /data-intake/forms de Cláudio retornou somente quatro formulários patrimoniais; nenhum formulário cadastral foi inferido por nome/ID.
- GET /preferences/catalog retornou moedas/idiomas/fusos/temas e países BR/PT; não contém gênero/estado civil/nacionalidade/atividade. GET /client/consents/requirements sem contexto retornou 400. Definições CPF/RG BR consultadas com sucesso.
- 116 testes aprovados: mapeamentos de perfil/endereço, preservação de campos, valores/zero/nulos/moeda, metadados temporais, exigência de relacionamento, esquema de documento, catálogos reais, retry da escrita e cache de arquivo isolado por cliente. Lint e build aprovados; diff do lote sem whitespace. Alterações preexistentes de PRODUCT.md e MILESTONE-3-INTEGRATION.md preservadas e excluídas do commit.
- Navegador local 9010: acesso sem sessão redirecionou ao login com retorno à etapa 5; login de Cláudio retornou à etapa pedida. Valores reais carregados; Continuar regravou profissional/financeiro sem alterar os valores e abriu etapa 6.
- Contato novo de teste exibiu exigência de relationship e manteve a tela; não criou registro. Ausência local abriu revisão com aviso de não persistência, sem excluir dados.
- Campo cidade de nascimento com texto fictício foi salvo via etapa 3 e apareceu na revisão. Campo restaurado em seguida. Componentes carregam dados antes de permitir edição, preservando rascunhos durante falha.
- Fluxo de criação/recebimento de código/aceite legal e upload de documentos novos ainda não homologados de ponta a ponta. Não foram criadas contas, aceitos termos ou enviados arquivos pessoais nesta rodada.

## Pendências reais

Textos/versões e contexto do aceite; múltiplas nacionalidades/país de nascimento; bairro separado; catálogos dos seletores e países/variantes ausentes; relationship para inclusão e ausência declarada; operação final de envio/recibo/revisão. Datas iniciais, preservação de metadados e conexão dos endpoints existentes são decisões/trabalho do front e não devem ser atribuídos a falta de API.

Checklist e documento consolidado no Admin atualizados com pendências e retestes separados. /cadastro/enviado permanece explicitamente uma referência visual, sem transição falsa de sucesso.
