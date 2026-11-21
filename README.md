# ManaDeck

Aplicação web pessoal para criar, organizar e acompanhar decks de **Magic: The Gathering**. Roda inteira no navegador, sem backend, sem login e sem build. Os dados ficam no `localStorage` e podem ser levados de um computador para outro por backup em JSON.

As cartas vêm da API pública da [Scryfall](https://scryfall.com/docs/api). A busca tenta primeiro cartas em **português** e, se não achar, tenta em **inglês**.

---

## Sumário

1. [Recursos](#recursos)
2. [Como rodar](#como-rodar)
3. [Guia de uso](#guia-de-uso)
4. [Regras de negócio](#regras-de-negócio)
5. [Integração com a Scryfall](#integração-com-a-scryfall)
6. [Lojas: pesquisa de preço](#lojas-pesquisa-de-preço)
7. [Dados e persistência](#dados-e-persistência)
8. [Backup: exportar e importar](#backup-exportar-e-importar)
9. [Estrutura do projeto](#estrutura-do-projeto)
10.   [Personalização](#personalização)
11.   [Limitações conhecidas](#limitações-conhecidas)
12.   [Solução de problemas](#solução-de-problemas)

---

## Recursos

- Criar e excluir múltiplos decks, com nome, formato, identidade de cor, descrição e link da Liga Magic.
- Carrossel de decks na página inicial, com capa, formato, cores e total de cartas.
- Pesquisa de cartas pela Scryfall (português primeiro, inglês como alternativa).
- Adicionar e remover cartas. Cópias repetidas são agrupadas em uma única entrada com quantidade.
- Filtros por tipo: criaturas, terrenos, encantamentos, sorceries, instants e artefatos.
- Ordenação automática por tipo e por custo de mana.
- Painel flutuante de estatísticas, atualizado a cada mudança.
- Status de cada carta no deck: **Tenho**, **Não tenho** ou **A comprar**, com filtro por status.
- Botões para pesquisar a carta nas lojas Geek4Ever e MTG Cards Games.
- Tela de pesquisa independente, com todas as informações da carta e legalidade por formato.
- Tema claro e escuro, salvo no navegador.
- Exportação e importação de backup em JSON, com validação e mesclagem sem apagar dados.

## Como rodar

Não há instalação, dependências nem servidor.

1. Extraia o projeto.
2. Abra `index.html` com um duplo clique, ou arraste o arquivo para o navegador.

Os scripts são clássicos (sem módulos ES), então tudo funciona direto pelo disco, via `file://`.

**Requisitos**

- Navegador moderno (Chrome, Edge, Firefox ou Safari recentes).
- Conexão com a internet para pesquisar cartas e carregar imagens.
- Tela de desktop. O layout tem largura mínima de 960 px e não é responsivo para celular.

## Guia de uso

### Navegação

A barra lateral fixa à esquerda tem:

- **Início**: carrossel com seus decks.
- **Pesquisar cartas**: consulta livre, sem adicionar a deck.
- **Exportar dados** e **Importar dados**: backup em JSON.
- **Tema claro/escuro**: alterna e lembra a escolha.

A tela atual fica destacada na barra. A página de um deck é uma subtela de Início.

### Criar um deck

Em **Início**, clique em **Novo deck**.

| Campo              | Obrigatório | Observação                                                              |
| ------------------ | ----------- | ----------------------------------------------------------------------- |
| Nome               | Sim         | Até 80 caracteres                                                       |
| Formato            | Sim         | Commander, Standard, Modern, Legacy, Vintage, Pioneer, Pauper ou Outros |
| Identidade de cor  | Não         | Uma ou mais cores: W, U, B, R, G                                        |
| Link da Liga Magic | Não         | Se preenchido, precisa começar com `http://` ou `https://`              |
| Descrição          | Não         | Até 500 caracteres                                                      |

Ao escolher **Outros**, aparece um campo de texto livre para o nome do formato. Se ficar vazio, o formato é salvo como "Outros".

A identidade de cor é escolhida manualmente e não é recalculada a partir das cartas. Os metadados do deck não podem ser editados depois de criado.

### Gerenciar um deck

Clique em **Abrir deck** no carrossel. A página mostra o cabeçalho (nome, formato, cores, descrição e link da Liga Magic), a área de busca, o catálogo de cartas e o painel de estatísticas.

**Adicionar cartas**

1. Digite o nome da carta e clique em **Buscar**.
2. O primeiro resultado aparece em um preview, com a imagem.
3. Clique em **Adicionar ao deck**. Cada clique soma mais uma cópia.

**Remover cartas**

Use **Remover 1** no card. Quando a quantidade chega a zero, a carta sai do catálogo.

**Excluir o deck**

O botão **Excluir deck** fica no topo da página do deck. O botão **Excluir** do carrossel faz o mesmo. Os dois pedem confirmação.

### Passar o mouse sobre uma carta

Ao passar o mouse sobre um card (ou focá-lo com o teclado), abre um painel colado embaixo dele, com:

- **Pesquisar na Geek4Ever** e **Pesquisar na MTG Cards Games**: abrem a busca da loja em outra aba.
- **Select de status**: Tenho, Não tenho ou A comprar.

O status também aparece como uma etiqueta fixa no canto da imagem:

| Etiqueta  | Cor     | Status                          |
| --------- | ------- | ------------------------------- |
| Tenho     | verde   | `owned`                         |
| Falta     | cinza   | `missing` (padrão ao adicionar) |
| A comprar | amarelo | `buy`                           |

### Filtros

O catálogo tem duas linhas de filtros que se combinam:

- **Tipo**: Todas, Criaturas, Terrenos, Encantamentos, Sorceries, Instants, Artefatos.
- **Status**: Qualquer status, Tenho, Não tenho, A comprar.

Uma carta com vários tipos aparece em todos os filtros correspondentes. Exemplo: uma Criatura Encantamento aparece em Criaturas e em Encantamentos.

### Painel de estatísticas

O painel fica no canto inferior direito e mostra: total de cartas, criaturas, terrenos, encantamentos, sorceries, instants, artefatos e o CMC médio.

### Pesquisar cartas (tela independente)

Digite o nome e pesquise. O resultado mostra a imagem à esquerda e as informações à direita. O botão das lojas aparece logo abaixo da imagem.

Campos exibidos, somente quando se aplicam à carta: nome, nome original, custo de mana, CMC, tipo, subtipos, texto e habilidades, poder, resistência, lealdade, defesa, raridade, identidade de cor, cores, artista, coleção, número, idioma e legalidade em cada formato.

Cartas de duas faces mostram as duas imagens. Se não houver imagem, aparece um placeholder.

## Regras de negócio

### Agrupamento de cartas

Duas cartas são a mesma entrada quando têm o mesmo `oracle_id` da Scryfall, ou seja, o mesmo nome gravado na carta, independente da edição. Sem `oracle_id`, o agrupamento usa o nome em minúsculas. O `id` da impressão é guardado só para obter a imagem.

### Categoria da carta

Uma carta pertence à **primeira** categoria desta lista que se aplique ao tipo da **face da frente**:

1. Criatura
2. Sorcery
3. Instant
4. Encantamento
5. Artefato
6. Terreno

Essa categoria define a ordenação e as estatísticas. Exemplo: Criatura Artefato conta como criatura. Tipos fora da lista (como Planeswalker) entram no total e na média, mas não têm categoria própria e ficam no fim da ordenação. Os filtros por tipo são a exceção: mostram a carta em todos os seus tipos.

### Ordenação

Aplicada automaticamente:

1. Pela ordem das categorias acima.
2. Dentro da categoria, por CMC crescente.
3. Em empate, por nome (alfabético).

### Estatísticas

- Total: soma de todas as cópias.
- Cada carta conta uma vez, na sua categoria principal.
- **CMC médio** = soma de `cmc × quantidade` das cartas que não são terreno, dividida pelo total de cópias dessas cartas.
- Terrenos ficam fora da média. Mágicas de custo zero entram na média.
- Sem cartas elegíveis, o painel mostra "—".

## Integração com a Scryfall

A busca usa `GET https://api.scryfall.com/cards/search`, com o parâmetro `q` codificado:

1. Primeiro `"nome" lang:pt`.
2. Se não houver resultado, `"nome" lang:en`.

Só "nenhum resultado" aciona o inglês. Outros erros aparecem direto, sem segunda tentativa. A aplicação usa o primeiro resultado.

**Dados aproveitados:** `id`, `oracle_id`, `name`, `printed_name`, `lang`, `mana_cost`, `cmc`, `type_line`, `printed_type_line`, `oracle_text`, `printed_text`, `colors`, `color_identity`, `power`, `toughness`, `loyalty`, `defense`, `rarity`, `artist`, `set_name`, `collector_number`, `image_uris`, `card_faces`, `legalities`.

**Imagens:** a aplicação usa `image_uris` e, para cartas de duas faces, `card_faces`. A capa do deck usa a imagem recortada (`art_crop`) da primeira carta do deck, ou a imagem normal se não houver recorte.

**Tratamento de erros**

| Situação                         | Mensagem ao usuário                                           |
| -------------------------------- | ------------------------------------------------------------- |
| Nenhuma carta (pt e en)          | "Nenhuma carta encontrada para … em português nem em inglês." |
| Falha de conexão                 | Aviso de falha de conexão                                     |
| Limite de requisições (HTTP 429) | Pedido para aguardar alguns segundos                          |
| Resposta inválida                | Aviso de resposta inválida                                    |
| API indisponível                 | Aviso de indisponibilidade, com o código HTTP                 |

Durante a consulta aparece um indicador de carregamento. Um erro de API não afeta o resto da aplicação.

## Lojas: pesquisa de preço

Os botões de loja abrem em outra aba uma busca montada a partir do nome da carta. Usa-se o **nome original em inglês** quando conhecido (`originalName`); senão, o nome salvo. Em cartas de duas faces, busca-se só pela face da frente. Espaços viram `+`.

| Loja            | Formato da URL                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Geek4Ever       | `https://www.geek4ever.com.br/?view=ecom%2Fitens&id=702687&searchExactMatch=&busca=NOME&btnEnviar=1`    |
| MTG Cards Games | `https://www.mtgcardsgames.com.br/?view=ecom%2Fitens&id=15760&searchExactMatch=&busca=NOME&btnEnviar=1` |

Os links **não** são salvos no JSON. São montados na hora. Se uma loja mudar o formato da URL, basta ajustar a lista `STORES` (veja [Personalização](#personalização)).

Cartas adicionadas antes de existir o campo `originalName` buscam pelo nome em português até serem removidas e adicionadas de novo.

## Dados e persistência

Todo o estado fica em uma chave do `localStorage`: **`manadeck:data`**. Qualquer alteração (criar ou excluir deck, adicionar ou remover carta, mudar status, trocar tema) é gravada na hora. Fechar ou atualizar o navegador não perde nada.

Estrutura:

```json
{
   "version": 1,
   "decks": [
      {
         "id": "deck-lx2k9a-4f7q1z",
         "name": "Meu Commander",
         "leagueUrl": "https://www.ligamagic.com.br/",
         "format": "Commander",
         "colors": ["U", "B"],
         "description": "Descrição do deck",
         "cards": [
            {
               "id": "id-da-impressao-na-scryfall",
               "oracleId": "oracle-id-da-scryfall",
               "name": "Nome em português",
               "originalName": "Original name",
               "status": "buy",
               "quantity": 2,
               "manaCost": "{1}{U}",
               "cmc": 2,
               "typeLine": "Creature — Wizard",
               "printedTypeLine": "Criatura — Mago",
               "colors": ["U"],
               "colorIdentity": ["U"],
               "imageUrl": "https://…",
               "artUrl": "https://…"
            }
         ]
      }
   ],
   "settings": {"theme": "light"}
}
```

Notas:

- `status` aceita `owned`, `missing` ou `buy`. Dados antigos com `owned: true/false` são convertidos automaticamente para `owned` ou `missing`.
- `typeLine` guarda o tipo em inglês (usado para categorizar). `printedTypeLine` guarda o tipo impresso, quando existe, e é o que aparece na tela.
- Os dados necessários para desenhar o deck ficam salvos localmente. Só a busca depende da internet.
- Os dados são do navegador e do perfil em que você usa a aplicação. Trocar de navegador, usar a janela anônima ou limpar os dados do site começa do zero. Faça backup com frequência.

## Backup: exportar e importar

### Exportar

Clique em **Exportar dados**. O arquivo baixado se chama `manadeck-backup-AAAA-MM-DD.json` e contém:

```json
{
  "app": "manadeck",
  "version": 1,
  "exportedAt": "2026-11-21T12:00:00.000Z",
  "decks": [ … ],
  "settings": { "theme": "light" }
}
```

### Importar

Clique em **Importar dados** e escolha um arquivo exportado.

**Validação (antes de alterar qualquer coisa)**

- O arquivo precisa ser um JSON válido.
- `version` precisa ser `1`.
- Se existir o campo `app`, precisa ser `manadeck`.
- `decks` precisa ser uma lista. Cada deck precisa ter `id` e `name`.
- Cada carta precisa ter `name` e `quantity` inteira maior ou igual a 1.

Se algo falhar, aparece uma mensagem de erro e **nenhum dado é alterado**.

**Mesclagem**

- Nenhum deck atual é apagado.
- Deck importado com `id` novo é adicionado.
- Deck importado com o mesmo `id` de um deck existente tem as cartas mescladas. Os **metadados do deck existente são preservados**.
- Carta que já existe no deck (mesmo `oracleId`, ou mesmo nome) tem as quantidades somadas.
- Carta nova é adicionada.
- Conflito de status: vale **Tenho** sobre **A comprar**, e **A comprar** sobre **Não tenho**.
- O tema do arquivo importado é ignorado. O tema atual é mantido.

Ao terminar, a aplicação mostra quantos decks foram adicionados e quantos foram mesclados.

> Importar o mesmo backup duas vezes soma as quantidades de novo. Importe cada arquivo apenas uma vez.

## Estrutura do projeto

```text
manadeck/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── ui.js          Helpers de DOM, toasts, pips de cor e mana, caixa de busca
│   ├── storage.js     Leitura e gravação no localStorage
│   ├── scryfall.js    Cliente da API e normalização das cartas
│   ├── cards.js       Categorias, filtros, ordenação, status, links de loja e detalhe da carta
│   ├── statistics.js  Cálculo das estatísticas do deck
│   ├── decks.js       Página inicial, criação e exclusão de decks, página do deck
│   ├── backup.js      Exportação, validação e mesclagem na importação
│   ├── navigation.js  Troca de telas e tela de pesquisa independente
│   └── app.js         Inicialização, tema e ligação da barra lateral
└── assets/
```

A ordem dos `<script>` em `index.html` importa: `ui`, `storage`, `scryfall`, `cards`, `statistics`, `decks`, `backup`, `navigation`, `app`. Todos compartilham o objeto global `window.MD`.

A interface está em português. O código, os nomes de variáveis e os campos do JSON estão em inglês.

## Personalização

**Adicionar ou trocar uma loja.** Em `js/cards.js`, edite a lista `STORES`:

```js
const STORES = [
   {name: "Geek4Ever", base: "https://…&busca="},
   {name: "MTG Cards Games", base: "https://…&busca="},
];
```

`base` é a URL até o parâmetro do nome. A aplicação acrescenta o nome codificado e `&btnEnviar=1`. Os botões aparecem sozinhos no hover do deck e na pesquisa independente.

**Cores do tema.** As cores estão como variáveis CSS no começo de `css/styles.css`, em `:root` (claro) e `[data-theme="dark"]` (escuro). Troque `--accent` para mudar o roxo de destaque.

**Formatos de deck.** Edite a lista `FORMATS` em `js/decks.js`.

**Novos status de carta.** Edite `STATUSES` em `js/cards.js`, o mapa `BADGE` em `js/decks.js`, a regra de prioridade `STATUS_RANK` em `js/backup.js` e as classes `.own-*` no CSS.

## Limitações conhecidas

Fora do escopo desta versão, por decisão do projeto:

- Autenticação, backend, banco remoto e sincronização entre dispositivos.
- Compartilhamento de decks.
- Validação das regras de construção dos formatos e limite de cópias.
- Histórico de alterações e histórico de pesquisas.
- Layout para celular.
- Edição dos metadados de um deck depois de criado.

Comportamentos para ter em mente:

- A busca usa só o primeiro resultado. Se vier uma carta diferente da desejada, tente um nome mais específico.
- Para adicionar mais uma cópia, pesquise a carta de novo e clique em adicionar. Não há botão "+" no catálogo.
- A categoria e o tipo usam a face da frente. Em cartas de duas faces, a face de trás não entra nos filtros.
- Tipos como Planeswalker e Battle não têm filtro próprio. Aparecem na visão "Todas".
- Os dados vivem no navegador. Sem backup, limpar os dados do site apaga tudo.

## Solução de problemas

**"Falha de conexão" ao pesquisar.** Confira a internet. Extensões de bloqueio ou redes restritas podem bloquear `api.scryfall.com`.

**Muitas requisições.** A Scryfall limita a taxa de pedidos. Espere alguns segundos.

**Cartas sem imagem.** A impressão encontrada não tem imagem na Scryfall, ou as imagens estão bloqueadas. A aplicação mostra um placeholder com o nome.

**Os decks sumiram.** Provavelmente você abriu em outro navegador ou perfil, ou os dados do site foram limpos. Restaure pelo botão **Importar dados**.

**O botão de exportar não baixa nada.** Verifique se o navegador não está bloqueando downloads automáticos para o arquivo local.

**A importação diz que o arquivo é inválido.** Use um arquivo gerado pelo próprio botão **Exportar dados**, sem edições manuais, e com `"version": 1`.

**Os botões de loja abrem uma busca vazia.** A loja pode ter mudado o formato da URL. Ajuste a `base` em `STORES`.

---

Magic: The Gathering é marca da Wizards of the Coast. Este projeto é pessoal, não afiliado a ela, e as informações e imagens das cartas vêm da Scryfall.
