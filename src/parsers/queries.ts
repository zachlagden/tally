const QUERIES: Record<string, string> = {};

const JS_BASE = `
(function_declaration) @function
(generator_function_declaration) @function
(function_expression) @function
(arrow_function) @function
(method_definition) @function
(class_declaration) @class
(class) @class
(variable_declarator) @variable
(if_statement) @branch
(for_statement) @branch
(for_in_statement) @branch
(while_statement) @branch
(do_statement) @branch
(switch_case) @branch
(catch_clause) @branch
(ternary_expression) @branch
`;

const TS_BASE = `
${JS_BASE}
(function_signature) @function
(interface_declaration) @class
(type_alias_declaration) @class
(enum_declaration) @class
`;

QUERIES.javascript = JS_BASE;
QUERIES.typescript = TS_BASE;
QUERIES.tsx = TS_BASE;

QUERIES.python = `
(function_definition) @function
(lambda) @function
(class_definition) @class
(assignment left: (identifier)) @variable
(assignment left: (attribute)) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(except_clause) @branch
(conditional_expression) @branch
`;

QUERIES.go = `
(function_declaration) @function
(method_declaration) @function
(func_literal) @function
(type_declaration (type_spec type: (struct_type))) @class
(type_declaration (type_spec type: (interface_type))) @class
(var_declaration (var_spec)) @variable
(short_var_declaration) @variable
(const_declaration (const_spec)) @variable
(if_statement) @branch
(for_statement) @branch
(communication_case) @branch
(default_case) @branch
(expression_case) @branch
(type_case) @branch
`;

QUERIES.rust = `
(function_item) @function
(closure_expression) @function
(struct_item) @class
(enum_item) @class
(trait_item) @class
(union_item) @class
(impl_item) @class
(let_declaration) @variable
(const_item) @variable
(static_item) @variable
(if_expression) @branch
(for_expression) @branch
(while_expression) @branch
(loop_expression) @branch
(match_arm) @branch
`;

QUERIES.java = `
(method_declaration) @function
(constructor_declaration) @function
(lambda_expression) @function
(class_declaration) @class
(interface_declaration) @class
(enum_declaration) @class
(record_declaration) @class
(local_variable_declaration) @variable
(field_declaration) @variable
(if_statement) @branch
(for_statement) @branch
(enhanced_for_statement) @branch
(while_statement) @branch
(do_statement) @branch
(switch_block_statement_group) @branch
(catch_clause) @branch
(ternary_expression) @branch
`;

QUERIES.c = `
(function_definition) @function
(struct_specifier body: (field_declaration_list)) @class
(union_specifier body: (field_declaration_list)) @class
(enum_specifier body: (enumerator_list)) @class
(declaration declarator: (init_declarator)) @variable
(declaration declarator: (identifier)) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(do_statement) @branch
(case_statement) @branch
(conditional_expression) @branch
`;

QUERIES.cpp = `
(function_definition) @function
(lambda_expression) @function
(class_specifier body: (field_declaration_list)) @class
(struct_specifier body: (field_declaration_list)) @class
(union_specifier body: (field_declaration_list)) @class
(enum_specifier body: (enumerator_list)) @class
(declaration declarator: (init_declarator)) @variable
(declaration declarator: (identifier)) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(do_statement) @branch
(case_statement) @branch
(conditional_expression) @branch
(catch_clause) @branch
`;

QUERIES.csharp = `
(method_declaration) @function
(constructor_declaration) @function
(local_function_statement) @function
(lambda_expression) @function
(class_declaration) @class
(interface_declaration) @class
(struct_declaration) @class
(record_declaration) @class
(enum_declaration) @class
(local_declaration_statement) @variable
(field_declaration) @variable
(if_statement) @branch
(for_statement) @branch
(for_each_statement) @branch
(while_statement) @branch
(do_statement) @branch
(switch_section) @branch
(catch_clause) @branch
(conditional_expression) @branch
`;

QUERIES.ruby = `
(method) @function
(singleton_method) @function
(block) @function
(do_block) @function
(class) @class
(module) @class
(singleton_class) @class
(assignment left: (identifier)) @variable
(assignment left: (instance_variable)) @variable
(if) @branch
(unless) @branch
(while) @branch
(until) @branch
(for) @branch
(when) @branch
(rescue) @branch
(conditional) @branch
`;

QUERIES.php = `
(function_definition) @function
(method_declaration) @function
(arrow_function) @function
(anonymous_function_creation_expression) @function
(class_declaration) @class
(interface_declaration) @class
(trait_declaration) @class
(enum_declaration) @class
(property_declaration) @variable
(if_statement) @branch
(for_statement) @branch
(foreach_statement) @branch
(while_statement) @branch
(do_statement) @branch
(switch_block) @branch
(catch_clause) @branch
(conditional_expression) @branch
`;

QUERIES.swift = `
(function_declaration) @function
(init_declaration) @function
(deinit_declaration) @function
(class_declaration) @class
(protocol_declaration) @class
(property_declaration) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(switch_statement) @branch
(catch_block) @branch
`;

QUERIES.kotlin = `
(function_declaration) @function
(anonymous_function) @function
(class_declaration) @class
(object_declaration) @class
(property_declaration) @variable
(if_expression) @branch
(for_statement) @branch
(while_statement) @branch
(when_expression) @branch
(catch_block) @branch
`;

QUERIES.scala = `
(function_definition) @function
(function_declaration) @function
(class_definition) @class
(object_definition) @class
(trait_definition) @class
(val_definition) @variable
(var_definition) @variable
(if_expression) @branch
(case_clause) @branch
(catch_clause) @branch
`;

QUERIES.bash = `
(function_definition) @function
(variable_assignment) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(case_statement) @branch
`;

QUERIES.dart = `
(function_signature) @function
(method_signature) @function
(class_definition) @class
(mixin_declaration) @class
(initialized_variable_definition) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(switch_statement) @branch
(catch_clause) @branch
`;

QUERIES.lua = `
(function_definition_statement) @function
(local_function_definition_statement) @function
(function_definition) @function
(local_variable_declaration) @variable
(if_statement) @branch
(elseif_clause) @branch
(for_generic_statement) @branch
(for_numeric_statement) @branch
(while_statement) @branch
(repeat_statement) @branch
`;

QUERIES.elixir = `
(call target: (identifier) @_def (#match? @_def "^(def|defp|defmacro|defmacrop)$")) @function
(call target: (identifier) @_def (#match? @_def "^(defmodule|defprotocol|defimpl)$")) @class
(call target: (identifier) @_branch (#match? @_branch "^(if|unless|case|cond|with)$")) @branch
`;

QUERIES.ocaml = `
(value_definition (let_binding pattern: (_) . (parameter))) @function
(value_definition (let_binding pattern: (_) . body: (fun_expression))) @function
(value_definition (let_binding pattern: (value_name) . body: (_))) @variable
(module_definition) @class
(class_definition) @class
(if_expression) @branch
(match_case) @branch
`;

QUERIES.elm = `
(value_declaration) @function
(type_declaration) @class
(if_expression) @branch
(case_of_expression) @branch
`;

QUERIES.zig = `
(function_declaration) @function
(struct_declaration) @class
(union_declaration) @class
(enum_declaration) @class
(variable_declaration) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(switch_expression) @branch
`;

QUERIES.solidity = `
(function_definition) @function
(modifier_definition) @function
(constructor_definition) @function
(contract_declaration) @class
(interface_declaration) @class
(library_declaration) @class
(struct_declaration) @class
(state_variable_declaration) @variable
(variable_declaration_statement) @variable
(if_statement) @branch
(for_statement) @branch
(while_statement) @branch
(catch_clause) @branch
`;

QUERIES.html = ``;
QUERIES.css = ``;
QUERIES.json = ``;
QUERIES.yaml = ``;
QUERIES.toml = ``;

export function getQueryFor(languageId: string): string | undefined {
  const q = QUERIES[languageId];
  return q && q.trim().length > 0 ? q : undefined;
}
