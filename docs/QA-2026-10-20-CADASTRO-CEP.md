# QA — preenchimento por CEP da etapa 4, 20/10/2026

## Implementação

Consulta validator-cep do cadastro legado extraída para um serviço compartilhado e reutilizada na etapa 4 Brasil. Usa o mesmo endpoint público já existente em sources.strategyanalytics.com.br, sem cookies/tokens de cliente e com timeout de 10 segundos. Não consulta outro provedor diretamente. A operação é de consulta, não grava perfil; escritas cadastrais continuam nos serviços/interceptors existentes.

Ao sair de CEP com oito dígitos, preenche Logradouro, Bairro, Cidade e Estado. Máscara e teclado numérico somente no CEP Brasil; nenhum botão/campo adicionado. Número e Complemento permanecem como digitados. O Estado usa UF/nome retornados pela consulta na opção existente, sem inventar catálogo de UF de expedição.

CEP incompleto não é consultado; inexistente ou erro mantém os dados e mostra orientação no próprio campo. Preenchimento manual permanece disponível. Respostas incompletas/CEP divergente não preenchem parcialmente. CEP genérico sem rua/bairro não apaga valores manuais. CEP já consultado não repete no blur nem sobrescreve correção manual.

Respostas antigas são ignoradas após mudar CEP ou sair da etapa; campos editados durante a consulta são preservados. Continuar aguarda a consulta em andamento; nenhuma gravação é feita automaticamente.

## Validação

- 135 testes aprovados, incluindo nove cenários de validação, preenchimento, ausência de logradouro/bairro, falha/retry, concorrência, descarte após saída, resposta inválida e transporte sem autenticação.
- Lint/build e diff do lote aprovados.
- Endpoint existente respondeu 200 para CEP público 01001000 e preflight permitiu localhost:9010 e hml.strategyanalytics.com.br.
- Local 9010 no navegador: CEP 01001-000 preencheu Praça da Sé, Sé, São Paulo/Estado São Paulo; Número 100 e Complemento preservados. CEP 99999-999 mostrou Não encontrado sem apagar endereço; voltar ao CEP válido removeu o erro.
- Desktop e viewport efetivo de 390 px conferidos, sem overflow horizontal ou novas ações. Não foi clicado Continuar, enviado documento ou gravado endereço. Aba original com documentos em rascunho preservada.

## Limites

Preenchimento por CEP não resolve ausência de bairro separado no payload cadastral, catálogo de UF de expedição ou o 403 documental da conta nova. Não homologa gravação de bairro nem upload/envio final. Retomada após novo login segue como próximo item do front.
