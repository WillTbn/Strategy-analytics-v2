# Cadastro — retomada do número do endereço

20/10/2026. Correção do adaptador de leitura, preservando campos, composição, assets e ações do Figma.

O portal gravava Logradouro e Número em line1 como logradouro, número, mas recolocava a linha inteira no Logradouro ao retomar. O adaptador agora separa o sufixo numérico nas variantes que têm Número separado (Brasil e América do Sul). A escrita mantém o contrato existente e não migra dados no servidor.

Linhas sem separador/sufixo reconhecível permanecem intactas; números em nomes de ruas não são separados sem delimitador. Vírgulas internas do logradouro são preservadas. Variantes com um único campo de endereço continuam recebendo line1 integral. Nenhuma regra nova de validação ou campo adicional foi criado.

121 testes aprovados, lint, build e diff do lote sem erros. Casos de regressão: leitura/gravação sem duplicar o número, ID/endereço secundário/complemento preservados, vírgulas no nome, número zero/sufixos/s/n, linhas sem número e variantes sem campo separado.

A conferência em homologação com a conta do usuário será registrada no checklist do Admin após a publicação. Sua aba com dados/arquivos não enviados deve ser preservada; usar outra aba com a mesma sessão para conferir a retomada sem gravar o formulário. CPF, documentos e arquivos pessoais não serão usados na validação dessa correção.
