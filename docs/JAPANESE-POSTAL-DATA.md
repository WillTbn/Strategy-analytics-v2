# Consulta postal japonesa no cadastro

A etapa Documento e endereço do Japão usa uma cópia versionada da base pública da Japan Post, servida pelo próprio frontend. Só são preenchidos Província e Cidade ou distrito. Rua, número e complemento não são inferidos; a consulta não altera o payload existente.

Fonte e permissão de redistribuição: [Japan Post — explicação dos dados UTF-8](https://www.post.japanpost.jp/service/search/zipcode/download/utf-readme.html). Publicação consultada: [base nacional de 30/10/2026](https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html).

A base contém municípios em japonês e códigos JIS das províncias. Esses códigos coincidem com os valores das 47 opções japonesas já existentes no cadastro; as opções do formulário continuam com seus rótulos atuais. Várias localidades do mesmo município não criam ambiguidade, pois o formulário só pede município/província. Um código associado a municípios diferentes não é escolhido automaticamente.

## Atualização reproduzível

1. Baixar o ZIP nacional UTF-8 pelo link oficial da publicação.
2. Executar `python3 scripts/update-japanese-postal.py --archive /caminho/utf_ken_all.zip --version AAAA-MM-DD`, com a data oficial da base.
3. Conferir o manifesto gerado (SHA256, contagens e ambiguidades), atualizar `JAPANESE_POSTAL_DATA` no serviço e executar os testes.
4. Publicar os arquivos junto com o frontend. Diretórios versionados evitam combinar catálogo e partes de versões diferentes.

O código postal completo não é enviado à Japan Post nem a outro fornecedor em tempo de execução. A busca carrega o catálogo e uma parte estática por prefixo de dois dígitos, sem credenciais, no mesmo domínio do site. As partes são reutilizadas; falhas permitem nova tentativa. Mantém preenchimento manual para código não encontrado, ambíguo ou consulta indisponível. A cópia não inclui códigos especiais de estabelecimentos; nesses casos o preenchimento manual continua disponível.
