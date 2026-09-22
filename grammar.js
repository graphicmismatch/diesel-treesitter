/// <reference types="tree-sitter-cli/dsl" />

function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}

module.exports = grammar({
  name: 'diesel',

  word: $ => $.identifier,

  extras: $ => [/[\s\uFEFF]/, $.comment],

  rules: {
    source_file: $ => repeat($._item),

    _item: $ => choice($.patch, $.blob_declaration),

    blob_declaration: $ => seq(
      field('kind', choice('sample', 'data')),
      field('id', $.identifier),
      '=',
      field('value', $.blob),
      ';',
    ),

    patch: $ => seq(
      'patch',
      optional(field('name', $.string)),
      field('body', $.patch_body),
    ),

    patch_body: $ => seq('{', repeat($._member), '}'),

    _member: $ => choice($.node, $.connection, $.macro, $.field),

    macro: $ => seq(
      'macro',
      field('name', $.string),
      '->',
      field('target', $.identifier),
      '(',
      field('min', $.number),
      ',',
      field('max', $.number),
      ')',
      ';',
    ),

    node: $ => seq(
      field('type', $._name),
      field('name', $.identifier),
      choice(';', seq(field('body', $.node_body), optional(';'))),
    ),

    node_body: $ => seq('{', repeat($._node_member), '}'),

    _node_member: $ => choice($.port_value, $.field),

    port_value: $ => seq(
      '.',
      field('port', $._name),
      '=',
      field('value', $.number),
      ';',
    ),

    connection: $ => seq(
      field('from', $.port_ref),
      '->',
      field('to', $.port_ref),
      ';',
    ),

    port_ref: $ => seq(
      field('node', $.identifier),
      '.',
      field('port', $._name),
    ),

    field: $ => seq(
      field('key', $._name),
      '=',
      field('value', $._value),
      ';',
    ),

    _value: $ => choice(
      $.number,
      $.string,
      $.boolean,
      $.blob,
      $.object,
      $.array,
      $.patch,
      $.identifier,
    ),

    object: $ => seq('{', commaSep($.pair), '}'),

    pair: $ => seq(
      field('key', $._name),
      '=',
      field('value', $._value),
    ),

    array: $ => seq('[', commaSep($._value), ']'),

    _name: $ => choice($.identifier, $.string),

    boolean: _ => choice('true', 'false'),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    number: _ => token(seq(
      optional('-'),
      choice(
        seq(/[0-9]+/, optional(seq('.', /[0-9]*/))),
        seq('.', /[0-9]+/),
      ),
      optional(seq(/[eE]/, optional(/[+-]/), /[0-9]+/)),
    )),

    string: _ => token(seq('"', repeat(choice(/[^"\\]/, seq('\\', /(.|\n)/))), '"')),

    blob: _ => token(seq('b64"', repeat(choice(/[^"\\]/, seq('\\', /(.|\n)/))), '"')),

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),
  },
});
