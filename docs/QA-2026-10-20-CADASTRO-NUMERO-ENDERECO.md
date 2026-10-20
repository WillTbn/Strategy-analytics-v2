# Cadastro — retomada do número do endereço

20/10/2026. Correção do adaptador de leitura, preservando campos, composição, assets e ações do Figma.

O portal gravava Logradouro e Número em line1 como logradouro, número, mas recolocava a linha inteira no Logradouro ao retomar. O adaptador agora separa o sufixo numérico nas variantes que têm Número separado (Brasil e América do Sul). A escrita mantém o contrato existente e não migra dados no servidor.

Linhas sem separador/sufixo reconhecível permanecem intactas; números em nomes de ruas não são separados sem delimitador. Vírgulas internas do logradouro são preservadas. Variantes com um único campo de endereço continuam recebendo line1 integral. Nenhuma regra nova de validação ou campo adicional foi criado.

121 testes aprovados, lint, build e diff do lote sem erros. Casos de regressão: leitura/gravação sem duplicar o número, ID/endereço secundário/complemento preservados, vírgulas no nome, número zero/sufixos/s/n, linhas sem número e variantes sem campo separado.

A conferência em homologação com a conta do usuário está registrada abaixo e no checklist do Admin. Sua aba com dados/arquivos não enviados foi preservada; a validação usou outra aba da mesma sessão sem gravar o formulário. CPF, documentos e arquivos pessoais não foram usados na validação dessa correção.

## Publicação e validação da conta do usuário

Portal fdb07ab; pipeline 39449807714 com upload/ativação aprovados. Teste em nova aba da mesma sessão em homologação confirmou Logradouro Rua Fictícia de Homologação e Número 100 separados; Voltar à revisão, Editar Endereço e recarga conferidos. A aba original tinha dados/arquivos ainda não enviados e foi preservada sem recarga.

Não houve Continuar nem escrita do formulário/documentos. Leituras administrativas antes/depois confirmaram endereço salvo idêntico. O teste de regravação sem duplicar o número é automatizado. Captura de evidência limitada aos campos necessários para evitar documentos/dados pessoais integrais. Checklist do Admin atualizado; 403 documental e demais dependências continuam abertas.
