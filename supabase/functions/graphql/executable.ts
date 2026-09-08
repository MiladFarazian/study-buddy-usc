/**
 * Builds an executable schema from SDL plus a resolver map.
 *
 * This is the small part of `@graphql-tools/schema` the gateway actually needs.
 * Keeping it here holds the runtime dependency list at `graphql` + `dataloader`,
 * which matters in an edge function where every npm specifier is a cold-start
 * fetch.
 */

import {
  buildSchema,
  type GraphQLFieldResolver,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLScalarType,
  type GraphQLSchema,
} from "graphql";

// deno-lint-ignore no-explicit-any
type ResolverMap = Record<string, any>;

export function makeExecutableSchema(
  typeDefs: string,
  resolvers: ResolverMap,
): GraphQLSchema {
  const schema = buildSchema(typeDefs);

  for (const [typeName, fieldResolvers] of Object.entries(resolvers)) {
    const type = schema.getType(typeName);

    if (!type) {
      throw new Error(
        `Resolver map defines "${typeName}", which the schema does not declare.`,
      );
    }

    // A custom scalar arrives as a fully-formed GraphQLScalarType. The schema
    // already holds a placeholder for it, so copy the behaviour across rather
    // than trying to swap the instance out of a built schema.
    if (fieldResolvers instanceof GraphQLScalarType) {
      if (!(type instanceof GraphQLScalarType)) {
        throw new Error(`"${typeName}" is not a scalar in the schema.`);
      }
      type.serialize = fieldResolvers.serialize;
      type.parseValue = fieldResolvers.parseValue;
      type.parseLiteral = fieldResolvers.parseLiteral;
      continue;
    }

    if (type instanceof GraphQLEnumType) continue;

    if (!(type instanceof GraphQLObjectType)) {
      throw new Error(
        `"${typeName}" cannot take field resolvers; it is ${type.toString()}.`,
      );
    }

    const fields = type.getFields();
    const entries = Object.entries(fieldResolvers) as [
      string,
      GraphQLFieldResolver<unknown, unknown>,
    ][];

    for (const [fieldName, resolve] of entries) {
      const field = fields[fieldName];
      if (!field) {
        // Catching this at boot beats shipping a resolver that silently never
        // runs because the field was renamed in the SDL.
        throw new Error(
          `Resolver "${typeName}.${fieldName}" has no matching schema field.`,
        );
      }
      field.resolve = resolve;
    }
  }

  return schema;
}
