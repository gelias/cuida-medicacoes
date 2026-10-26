# Cuida — controle familiar

Site móvel para estoque de medicações, receitas e consultas. Publicado no GitHub Pages; persistência privada no Cloudflare D1 (SQLite), através do Worker de avisos já existente.

## Usar em outro aparelho

Abra o site e escolha **Conectar controle**. Informe o endereço do serviço e a mesma chave privada da família (ACCESS_KEY). O aparelho carrega o cadastro da nuvem. A conversa e a ativação do Telegram permanecem no servidor; não é preciso conectar o bot novamente.

Na primeira conexão, cadastros locais existentes são enviados somente se não houver outra versão na nuvem. Em caso de divergência, o site preserva as duas versões e pede uma escolha. Baixe um backup antes de substituir cadastros.

## Persistência e funcionamento sem conexão

Cada gravação usa a revisão lida pelo aparelho. Uma revisão antiga recebe conflito, em vez de sobrescrever uma alteração mais recente. Dados e plano de compras são gravados na mesma operação do banco. Alterações sem conexão ficam preservadas no aparelho e são reenviadas ao voltar. O site confere atualizações ao voltar para a aba e a cada minuto enquanto estiver visível. Evite limpar os dados do navegador antes de concluir um envio pendente.

A chave dá acesso ao controle completo da família. Ela é informada uma vez em cada navegador e não faz parte dos backups. Não há cadastro individual de usuários nesta versão. Os cadastros e as chaves nunca devem ser incluídos neste repositório público.

## Publicação

Estes arquivos estáticos ficam na raiz de `main`, com Pages configurado para `main / (root)`. O Worker privado deve ser atualizado antes do site. Ele usa o banco D1 existente, tabela `settings`, sem nova migração de schema. Os segredos ACCESS_KEY e TELEGRAM_BOT_TOKEN permanecem na Cloudflare.

O Telegram envia somente avisos de compra. Dados de receitas e consultas são guardados privadamente no D1; não são enviados nas mensagens. Os avisos continuam funcionando com o site fechado.

Backups continuam disponíveis para recuperação independente. Eles contêm dados médicos: mantenha-os privados.
