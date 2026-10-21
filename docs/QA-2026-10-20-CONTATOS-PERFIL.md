# QA 8 — contatos de confiança no perfil, 20/10/2026

## Correção do frontend

O backend já aceita contato com nome e telefone, sem relationship. O perfil ainda restringia Editar a uma lista de exatamente um contato. Removida essa restrição local: uma lista vazia abre o par de campos existente para o primeiro cadastro; vários contatos abrem os mesmos pares para edição dos registros existentes.

Preservados o card, os rótulos e os botões Editar/Salvar/Descartar. Não há novos campos de relacionamento/e-mail, ações de adicionar linhas ou excluir, nem alteração no requisito de identificação aprovada. Consulta falha ou pendente continua bloqueando a edição.

Na abertura, os contatos são relidos antes de formar o rascunho. Escritas usam os serviços clientApi existentes. Antes do envio são validados todos os nomes/telefones e a correspondência dos IDs. Registros inalterados não são regravados; campos ocultos reais são preservados. Após falha parcial, retry envia apenas os registros ainda pendentes. Troca de sessão interrompe o lote.

## Checklist

- [x] Primeiro contato sem inventar relationship/e-mail.
- [x] Edição de múltiplos contatos por ID; sem remoção ou inclusão de linhas adicionais.
- [x] Validação integral antes da primeira escrita, incluindo telefone inválido.
- [x] Retry parcial preserva o rascunho e não repete atualizações confirmadas.
- [x] Troca de sessão interrompe escritas seguintes.
- [x] Renderização do template real para zero/dois contatos: apenas nome e telefone, Salvar/Descartar existentes.
- [x] 207 testes, lint e build locais aprovados.
- [ ] Reteste visual e integrado da versão publicada.

Concorrência/falhas são verificadas por respostas controladas em testes, sem induzir falhas no backend. Persistência da declaração de ausência de contatos e envio final do cadastro continuam pendências reais separadas; não foram simulados.
