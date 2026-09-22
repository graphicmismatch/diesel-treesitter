# tree-sitter-diesel

A [tree-sitter](https://tree-sitter.github.io) grammar for **Diesel**, the C-like text
format used by the [Petroleum](https://github.com/graphicmismatch/Petroleum) synthesizer
for patches (`.dsl` files). Diesel converts losslessly to and from Petroleum's binary
`.ptr` patches and renders to WAV from the command line.

The grammar follows `Petroleum/src/main/java/Petroleum/Serialization/Diesel.java` - its
lexer and recursive-descent reader are the specification. The language guide is
`DIESEL.md` at the root of the Petroleum repository.

```diesel
patch "Demo" {
    version = 6;

    Phasor phasor1 {
        x = 0; y = 0;
        .frequency = 440;
    }
    Oscillator oscillator1 {
        x = 260; y = 0;
        oscillator = { kind = "factory", name = "Sine" };
    }
    "Audio Out" audio_out1 { x = 520; y = 0; }

    phasor1.out -> oscillator1.phase;
    oscillator1.out -> audio_out1.in;

    macro "level" -> constant1(0, 1);
}

data d1 = b64"AAECAwQ=";
```

## What it covers

| Construct | Example |
| --- | --- |
| Patch | `patch "Name" { ... }`, nested as a value for subpatch nodes |
| Node | `Phasor p1 { ... }`, `Constant k1;`, quoted types like `"Audio Out" o1 { }` |
| Field | `x = 0;`, `oscillator = { kind = "factory", name = "Sine" };` |
| Port value | `.frequency = 440;` |
| Connection | `p1.out -> o1.in;` (port names may be quoted) |
| Macro | `macro "cutoff" -> k1(20, 20000);` |
| Blob | `sample s1 = b64"...";`, `data d1 = b64"...";` |
| Values | numbers (`-1.5e3`), strings with escapes, `true`/`false`, bare identifiers, objects, arrays |
| Comments | `// line` and `/* block */` |

## Usage

```sh
npm install            # optional - only the CLI is needed
tree-sitter generate   # regenerate src/parser.c from grammar.js
tree-sitter test       # run the corpus in test/corpus
tree-sitter parse file.dsl
```

The generated parser in `src/` is committed, so consumers do not need the CLI.

### Neovim (nvim-treesitter)

```lua
require('nvim-treesitter.parsers').get_parser_configs().diesel = {
  install_info = {
    url = 'https://github.com/graphicmismatch/diesel-treesitter',
    files = { 'src/parser.c' },
    branch = 'master',
  },
  filetype = 'diesel',
}
vim.filetype.add({ extension = { dsl = 'diesel' } })
```

Then `:TSInstall diesel`, and copy `queries/` into your own `queries/diesel/` directory
(or let nvim-treesitter pick them up from the parser repository).

### Helix

```toml
# languages.toml
[[language]]
name = "diesel"
scope = "source.diesel"
file-types = ["dsl"]
comment-token = "//"
indent = { tab-width = 4, unit = "    " }

[[grammar]]
name = "diesel"
source = { git = "https://github.com/graphicmismatch/diesel-treesitter", rev = "HEAD" }
```

## Queries

- `queries/highlights.scm` - syntax highlighting
- `queries/locals.scm` - node names as definitions, connection/macro ends as references
- `queries/folds.scm` - fold patch, node, object and array bodies
- `queries/injections.scm` - placeholder; Diesel embeds no other language

## Language server

Diagnostics, completion, hover, go-to-definition, symbols and rename live in a separate
repository: [diesel-lsp](../diesel-lsp).

## Licence

MIT.
