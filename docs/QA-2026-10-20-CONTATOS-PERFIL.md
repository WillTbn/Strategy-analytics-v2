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
- [x] Publicação funcional 2591a8b, [pipeline 39526079478](https://github.com/WillTbn/Strategy-analytics-v2/actions/runs/39526079478) concluída com sucesso.
- [x] Conta do usuário em homologação: lista vazia abre Editar, nome sem telefone e telefone inválido impedem envio; descarte limpa erro/rascunho e reabertura permanece vazia. Nenhum contato foi criado nessa conta.
- [x] Desktop 1366 px e mobile 390 px: mesmos campos/ações; mobile com clientWidth/scrollWidth 378/378 px. Viewport restaurado.
- [x] Teste integrado do adaptador com a API de homologação do Cláudio: criação sem relacionamento, edição e leitura confirmadas; contato descartável removido e lista original preservada.
- [ ] Reteste manual de lista múltipla em conta aprovada pelo QA. Comportamento já coberto automaticamente, inclusive template real, preservação de metadados e falha parcial.

Evidências: cliente-contatos-primeiro-editor-hml.png e cliente-contatos-primeiro-editor-mobile-hml.png na pasta de visualizações da sessão.

Concorrência/falhas são verificadas por respostas controladas em testes, sem induzir falhas no backend. Persistência da declaração de ausência de contatos e envio final do cadastro continuam pendências reais separadas; não foram simulados.
