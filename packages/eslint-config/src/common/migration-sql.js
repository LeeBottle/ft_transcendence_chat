// @ts-check

/**
 * Identifier 변수 선언부 역추적
 *
 * @param {import('eslint').SourceCode} sourceCode - ESLint SourceCode 객체
 * @param {import('eslint').Rule.Node} argNode - 검사 대상 AST 노드
 *
 * @returns {import('eslint').Rule.Node | null}
 */
function resolveTargetNode(sourceCode, argNode) {
  if (argNode.type !== 'Identifier') {
    return argNode;
  }

  const targetAstNode = argNode;
  const scope = sourceCode.getScope(targetAstNode);
  const reference = scope.references.find((ref) => ref.identifier === argNode);
  const varDef = reference?.resolved?.defs.find(
    (def) => def.type === 'Variable' && def.node.type === 'VariableDeclarator',
  );

  return varDef?.node.init ?? null;
}

/** @type {import('eslint').Rule.RuleModule} */
const autoSqlCommentRule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    messages: {
      missingSqlComment: 'query() 함수의 첫 번째 템플릿 인자 앞에 /* sql */ 주석이 누락되었습니다.',
    },
  },
  create(context) {
    const sourceCode = /** @type {import('eslint').SourceCode} */ (context.sourceCode);

    return {
      CallExpression(node) {
        if (!isQueryMethodCall(node)) {
          return;
        }

        const firstArg = /** @type {import('eslint').Rule.Node | undefined} */ (node.arguments[0]);

        if (!firstArg) {
          return;
        }

        const targetNode = resolveTargetNode(sourceCode, firstArg);

        if (!targetNode) {
          return;
        }

        const isTemplate = targetNode.type === 'TemplateLiteral';
        const isStringLiteral =
          targetNode.type === 'Literal' && typeof targetNode.value === 'string';

        if (!isTemplate && !isStringLiteral) {
          return;
        }

        const comments = sourceCode.getCommentsBefore(targetNode);
        const lastComment = comments.at(-1);
        const hasStrictSqlComment = lastComment?.value === ' sql ';
        const hasLooseSqlComment = lastComment?.value.trim().toLowerCase() === 'sql';

        // 케이스 1: 첫 번째 인자가 이미 백틱 문자열 경우 -> 주석 유무/포맷만 검사
        if (isTemplate) {
          // /* sql */ 주석이 없으면 보고 및 --fix 시 자동 삽입
          if (!hasStrictSqlComment) {
            context.report({
              node: targetNode,
              messageId: 'missingSqlComment',
              fix(fixer) {
                const hasLooseSqlComment = lastComment?.value.trim().toLowerCase() === 'sql';

                if (hasLooseSqlComment) {
                  return fixer.replaceText(lastComment, '/* sql */');
                }

                return fixer.insertTextBefore(targetNode, '/* sql */ ');
              },
            });
          }

          return;
        }

        // 케이스 2: 일반 따옴표 문자열인 경우 -> 백틱 변환 및 주석 자동 보정
        if (isStringLiteral) {
          const rawStringValue =
            'value' in targetNode && typeof targetNode.value === 'string' ? targetNode.value : '';

          context.report({
            node: targetNode,
            messageId: 'missingSqlComment',
            fix(fixer) {
              // 백틱 내부에서 문법 오류를 방지하기 위해 이스케이프 처리
              const escapedContent = rawStringValue
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\${/g, '\\${');

              const templateText = `\`${escapedContent}\``;

              // 2-1. 이미 앞에 정확한 /* sql */ 주석이 있는 경우: 문자열만 백틱으로 교체
              if (hasStrictSqlComment) {
                return fixer.replaceText(targetNode, templateText);
              }

              // 2-2. /* SQL */ 등 비표준 주석이 있는 경우: 주석 정규화 + 문자열 백틱 교체 (배열 반환)
              if (hasLooseSqlComment) {
                return [
                  fixer.replaceText(lastComment, '/* sql */'),
                  fixer.replaceText(targetNode, templateText),
                ];
              }

              // 2-3. 주석이 아예 없는 경우: /* sql */ 주석과 함께 백틱으로 교체
              return fixer.replaceText(targetNode, `/* sql */ ${templateText}`);
            },
          });
        }
      },
    };
  },
};

/** @type {import('eslint').Linter.Config} */
export const migrationSqlCommentConfig = {
  files: ['src/database/migrations/**/*.ts'],
  plugins: { 'custom-sql': { rules: { 'auto-sql-comment': autoSqlCommentRule } } },
  rules: { 'custom-sql/auto-sql-comment': 'error' },
};

/**
 * 쿼리 함수 호출(.query(...)) 여부 판별
 *
 * @param {import('eslint').Rule.Node} node
 *
 * @returns {boolean}
 */
function isQueryMethodCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'query'
  );
}
