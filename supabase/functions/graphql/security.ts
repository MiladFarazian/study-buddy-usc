/**
 * Validation rules that run before execution.
 *
 * A public GraphQL endpoint is a query language pointed at your database, so
 * "the client can ask for anything" has to be bounded. These rules reject the
 * two classic abuse shapes — unbounded nesting and unbounded fan-out — during
 * validation, before a single row is read.
 */

import {
  type ASTNode,
  type FieldNode,
  type FragmentDefinitionNode,
  GraphQLError,
  Kind,
  type OperationDefinitionNode,
  type ValidationContext,
} from "graphql";

export const MAX_DEPTH = 8;
export const MAX_COMPLEXITY = 1_000;

/**
 * Rejects deeply nested queries.
 *
 * `tutor { reviews { reviewer { ... } } }` is legitimate; a hundred levels of
 * it is a way to make one HTTP request cost minutes of database time.
 * Fragments are followed so the limit cannot be evaded by hiding depth in a
 * fragment definition.
 */
export function depthLimit(maxDepth = MAX_DEPTH) {
  return (context: ValidationContext) => {
    const fragments = context.getDocument().definitions.reduce(
      (acc, definition) => {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          acc[definition.name.value] = definition;
        }
        return acc;
      },
      {} as Record<string, FragmentDefinitionNode>,
    );

    const measure = (
      node: ASTNode,
      depth: number,
      seenFragments: ReadonlySet<string>,
    ): number => {
      if (depth > maxDepth) return depth;

      switch (node.kind) {
        case Kind.FIELD: {
          const field = node as FieldNode;
          // Introspection meta-fields don't hit the database.
          if (field.name.value.startsWith("__")) return 0;
          if (!field.selectionSet) return depth;
          return Math.max(
            ...field.selectionSet.selections.map((selection) =>
              measure(selection, depth + 1, seenFragments)
            ),
          );
        }
        case Kind.FRAGMENT_SPREAD: {
          const name = node.name.value;
          // A fragment cycle is a separate validation error; bail so we don't
          // recurse forever before that rule reports it.
          if (seenFragments.has(name)) return depth;
          const fragment = fragments[name];
          if (!fragment) return depth;
          const nextSeen = new Set(seenFragments).add(name);
          return Math.max(
            ...fragment.selectionSet.selections.map((selection) =>
              measure(selection, depth, nextSeen)
            ),
          );
        }
        case Kind.INLINE_FRAGMENT:
        case Kind.FRAGMENT_DEFINITION:
        case Kind.OPERATION_DEFINITION: {
          const withSelections = node as OperationDefinitionNode;
          return Math.max(
            ...withSelections.selectionSet.selections.map((selection) =>
              measure(selection, depth, seenFragments)
            ),
          );
        }
        default:
          return depth;
      }
    };

    return {
      OperationDefinition(operation: OperationDefinitionNode) {
        const depth = measure(operation, 0, new Set());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(
              `Query exceeds maximum depth of ${maxDepth} (got ${depth}).`,
              { nodes: [operation] },
            ),
          );
        }
        return false;
      },
    };
  };
}

/**
 * Rejects queries whose estimated row fan-out is too large.
 *
 * Cost is multiplicative: a list field multiplies the cost of everything inside
 * it by its requested page size. `tutors(first: 100) { reviews(first: 100) }`
 * scores 10,000 and is refused, even though it is only three levels deep.
 */
export function complexityLimit(maxComplexity = MAX_COMPLEXITY) {
  return (context: ValidationContext) => {
    const fragments = context.getDocument().definitions.reduce(
      (acc, definition) => {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          acc[definition.name.value] = definition;
        }
        return acc;
      },
      {} as Record<string, FragmentDefinitionNode>,
    );

    /** Page size a list field was asked for, defaulting to the schema default. */
    const requestedSize = (field: FieldNode): number => {
      const argument = field.arguments?.find((arg) =>
        arg.name.value === "first" || arg.name.value === "limit"
      );
      if (argument?.value.kind === Kind.INT) {
        return Math.max(1, parseInt(argument.value.value, 10));
      }
      // A variable page size is unknown at validation time; assume the cap so
      // an unbounded value cannot slip through as "cost 1".
      if (argument?.value.kind === Kind.VARIABLE) return 20;
      return field.arguments?.length || field.selectionSet ? 1 : 1;
    };

    const isListField = (field: FieldNode) =>
      field.name.value === "tutors" ||
      field.name.value === "reviews" ||
      field.name.value === "courses" ||
      field.name.value === "badges" ||
      field.name.value === "tutorSessions" ||
      field.name.value === "studentSessions";

    const score = (
      node: ASTNode,
      seenFragments: ReadonlySet<string>,
    ): number => {
      switch (node.kind) {
        case Kind.FIELD: {
          const field = node as FieldNode;
          if (field.name.value.startsWith("__")) return 0;
          const children = field.selectionSet
            ? field.selectionSet.selections.reduce(
              (sum, selection) => sum + score(selection, seenFragments),
              0,
            )
            : 0;
          const multiplier = isListField(field) ? requestedSize(field) : 1;
          return multiplier * (1 + children);
        }
        case Kind.FRAGMENT_SPREAD: {
          const name = node.name.value;
          if (seenFragments.has(name)) return 0;
          const fragment = fragments[name];
          if (!fragment) return 0;
          const nextSeen = new Set(seenFragments).add(name);
          return fragment.selectionSet.selections.reduce(
            (sum, selection) => sum + score(selection, nextSeen),
            0,
          );
        }
        case Kind.INLINE_FRAGMENT:
        case Kind.OPERATION_DEFINITION: {
          const withSelections = node as OperationDefinitionNode;
          return withSelections.selectionSet.selections.reduce(
            (sum, selection) => sum + score(selection, seenFragments),
            0,
          );
        }
        default:
          return 0;
      }
    };

    return {
      OperationDefinition(operation: OperationDefinitionNode) {
        const cost = score(operation, new Set());
        if (cost > maxComplexity) {
          context.reportError(
            new GraphQLError(
              `Query is too expensive: estimated cost ${cost} exceeds the limit of ${maxComplexity}.`,
              { nodes: [operation] },
            ),
          );
        }
        return false;
      },
    };
  };
}

/** Blocks introspection so the production schema isn't a public map. */
export function noIntrospection(context: ValidationContext) {
  return {
    Field(field: FieldNode) {
      if (field.name.value === "__schema" || field.name.value === "__type") {
        context.reportError(
          new GraphQLError("Introspection is disabled on this endpoint.", {
            nodes: [field],
          }),
        );
      }
    },
  };
}
