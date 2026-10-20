# Validação do frontend — 20/10/2026

Este lote remove o bloqueio de lint registrado nas rodadas anteriores. Não aprova integralmente os 19 itens do QA, o cadastro de sete etapas ou módulos sem integração.

## Correções

- Migrada a configuração legada para ESLint 9, preservando as regras essenciais do Vue e o Prettier. Os diretórios gerados, Capacitor e Cordova continuam excluídos; nenhuma dependência foi atualizada e nenhuma regra essencial foi desligada.
- Corrigidos os 17 erros detectados: defaults de arrays agora são fábricas por instância; marcação inválida de um separador passou a usar span; índices e componentes não usados foram retirados; arquivo vazio e sem referências foi removido.
- Nos componentes legados BolsasChart e RedesChart, ref foi importado, a série acompanha a prop recebida e a chave sem variável definida foi retirada. Rótulos, dados fornecidos, estilos e composição não foram alterados.
- O comando npm test agora executa a suíte real. O deploy passa por lint e testes antes do build e upload.

Os componentes de crédito e distribuição ainda contêm protótipos fora do escopo integrado. Corrigir sintaxe/reatividade não os transforma em fluxos homologados nem autoriza usar dados de exemplo para clientes reais.

## Verificação

- npm run lint: aprovado globalmente, sem erros ou avisos de ESLint.
- npm test: 52 testes aprovados. Os três novos cenários compilam os SFCs e verificam inicialização, atualização da série e isolamento das coleções entre instâncias. A suíte existente de sessão, autenticação, Home, perfil e preferências continua aprovada.
- npm run build: aprovado com avisos preexistentes de dependências/fontes/chunks.
- git diff --check: aprovado nos arquivos do lote. As alterações anteriores em PRODUCT.md e docs/MILESTONE-3-INTEGRATION.md foram preservadas.
- Reteste local na porta 9010: Cláudio entrou na Home com seus saldos e contrato reais; o perfil identificou Claudio Manhães e preservou o aviso/documentação pendente e a edição desabilitada. Nenhuma escrita cadastral, aprovação documental ou movimentação financeira foi realizada.

As lacunas do backend permanecem no documento consolidado do repositório strategy-control: docs/PENDENCIAS-BACKEND-QA.md. Valores do contrato encerrado, comparação, série, documentos/revisão, cadastros e sessão HttpOnly não são encerrados por este lote técnico.
