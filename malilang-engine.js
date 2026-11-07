// ============================================================
// MALILANG ENGINE — NAVIGATEUR (Browser Port)
// Lexer + Parser + Interpreter basés sur les sources originales
// de Massiré Kamara — /Desktop/malilang/lib/
// ============================================================

// ============================================================
// KEYWORDS (keywords.json inlinés pour le browser)
// ============================================================
const MALILANG_KEYWORDS = {
  "NULL": ["fu"],
  "PRINT": ["sebeni"],
  "VAR": ["faleden", "fanga"],
  "IF": ["ni"],
  "ELSEIF": ["noteni"],
  "ELSE": ["note"],
  "WHILE": ["kamasoro"],
  "FUNC": ["barakunda"],
  "RETURN": ["segini"],
  "TRUE": ["sebe"],
  "FALSE": ["nkalo"],
  "SWITCH": ["sugandi"],
  "CASE": ["gnenata"],
  "DEFAULT": ["folo"],
  "BREAK": ["karali"],
  "FOR": ["koson"],
  "FOREACH": ["fole"],
  "IN": ["kono"],
  "CLASS": ["kilasi"],
  "CONSTRUCTOR": ["jolikaila"],
  "NEW": ["kura"],
  "THIS": ["nin"],
  "EXTENDS": ["bora"],
  "SUPER": ["ba"],
  "TRY": ["korobo"],
  "CATCH": ["fili"],
  "THROW": ["kake"]
};

const keywordMap = {};
for (const type in MALILANG_KEYWORDS) {
  for (const word of MALILANG_KEYWORDS[type]) {
    keywordMap[word] = type;
  }
}

// ============================================================
// LEXER
// ============================================================
function lexer(input) {
  let i = 0;
  const tokens = [];
  let line = 1, col = 1;

  function peek() { return input[i] || null; }
  function advance() {
    const ch = input[i++];
    if (ch === "\n") { line++; col = 1; } else col++;
    return ch;
  }
  function add(type, value = null) {
    tokens.push({ type, value, line, col });
  }

  while (i < input.length) {
    let ch = peek();

    // Espaces
    if (/\s/.test(ch)) { advance(); continue; }

    // Commentaires ligne //
    if (ch === "/" && input[i + 1] === "/") {
      while (peek() !== "\n" && peek() !== null) advance();
      continue;
    }
    // Commentaires /* */
    if (ch === "/" && input[i + 1] === "*") {
      advance(); advance();
      while (true) {
        if (peek() === null) throw new Error(`Commentaire multi-ligne non terminé (ligne ${line})`);
        if (peek() === "*" && input[i + 1] === "/") { advance(); advance(); break; }
        advance();
      }
      continue;
    }
    // Commentaires # (MaliLang style)
    if (ch === "#") {
      while (peek() !== "\n" && peek() !== null) advance();
      continue;
    }

    // Nombres
    if (/[0-9]/.test(ch)) {
      let num = "";
      while (/[0-9.]/.test(peek())) num += advance();
      add("NUMBER", Number(num));
      continue;
    }

    // Strings "..."
    if (ch === '"') {
      advance();
      let str = "";
      while (peek() !== '"' && peek() !== null) {
        if (peek() === '\\') { advance(); str += advance(); }
        else str += advance();
      }
      advance();
      add("STRING", str);
      continue;
    }

    // Strings '...'
    if (ch === "'") {
      advance();
      let str = "";
      while (peek() !== "'" && peek() !== null) str += advance();
      advance();
      add("STRING", str);
      continue;
    }

    // Identifiants / mots-clés
    if (/[a-zA-ZÀ-ÿ_]/.test(ch)) {
      let id = "";
      while (/[a-zA-ZÀ-ÿ_0-9]/.test(peek())) id += advance();
      if (keywordMap[id]) add(keywordMap[id], id);
      else add("IDENT", id);
      continue;
    }

    // Opérateurs doubles (==, !=, <=, >=)
    if (["=", "!", "<", ">"].includes(ch) && input[i + 1] === "=") {
      add("OP", ch + "="); advance(); advance(); continue;
    }

    // Opérateurs logiques && ||
    if ((ch === "&" && input[i + 1] === "&") || (ch === "|" && input[i + 1] === "|")) {
      add("OP", ch + input[i + 1]); advance(); advance(); continue;
    }

    // Opérateur ! seul
    if (ch === "!" && input[i + 1] !== "=") { add("OP", "!"); advance(); continue; }

    // Opérateurs simples
    if ("+-*/%=<>".includes(ch)) { add("OP", ch); advance(); continue; }

    // Symboles
    if (ch === "{") { add("LBRACE", "{"); advance(); continue; }
    if (ch === "}") { add("RBRACE", "}"); advance(); continue; }
    if (ch === "(") { add("LPAREN", "("); advance(); continue; }
    if (ch === ")") { add("RPAREN", ")"); advance(); continue; }
    if (ch === ",") { add("COMMA", ","); advance(); continue; }
    if (ch === ":") { add("COLON", ":"); advance(); continue; }
    if (ch === ";") { add("SEMI", ";"); advance(); continue; }
    if (ch === "[") { add("LBRACKET", "["); advance(); continue; }
    if (ch === "]") { add("RBRACKET", "]"); advance(); continue; }
    if (ch === ".") { add("DOT", "."); advance(); continue; }

    throw new Error(`Caractère '${ch}' non reconnu (ligne ${line}, col ${col})`);
  }

  add("EOF");
  return tokens;
}

// ============================================================
// PARSER
// ============================================================
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) { return this.tokens[this.pos + offset] || { type: "EOF" }; }
  next() { return this.tokens[this.pos++] || { type: "EOF" }; }
  match(type) { if (this.peek().type === type) return this.next(); return null; }

  expect(type) {
    if (this.peek().type !== type) {
      throw new Error(`Erreur de syntaxe : attendu '${type}', trouvé '${this.peek().value || this.peek().type}' (ligne ${this.peek().line})`);
    }
    return this.next();
  }

  parseProgram() {
    const body = [];
    while (this.peek().type !== "EOF") {
      body.push(this.parseStatement());
    }
    return { type: "Program", body };
  }

  parseStatement() {
    const tok = this.peek();
    switch (tok.type) {
      case "VAR":    return this.parseVarDecl();
      case "PRINT":  return this.parsePrint();
      case "IF":     return this.parseIf();
      case "WHILE":  return this.parseWhile();
      case "FOR":    return this.parseFor();
      case "FOREACH":return this.parseForeach();
      case "FUNC":   return this.parseFunc();
      case "RETURN": return this.parseReturn();
      case "BREAK":  this.next(); return { type: "BreakStatement" };
      case "SWITCH": return this.parseSwitch();
      case "TRY":    return this.parseTry();
      case "CLASS":  return this.parseClass();
      case "THROW":  { this.next(); const arg = this.parseExpression(); return { type: "ThrowStatement", argument: arg }; }
    }
    return this.parseExpressionStatement();
  }

  parseVarDecl() {
    this.expect("VAR");
    const name = this.expect("IDENT").value;
    this.expect("OP"); // '='
    const value = this.parseExpression();
    return { type: "VarDeclaration", name, value };
  }

  parsePrint() {
    this.expect("PRINT");
    const value = this.parseExpression();
    return { type: "PrintStatement", value };
  }

  parseIf() {
    this.expect("IF");
    const test = this.parseExpression();
    this.expect("LBRACE");
    const consequent = this.parseBlock();
    const elseif = [];
    while (this.match("ELSEIF")) {
      const cond = this.parseExpression();
      this.expect("LBRACE");
      const body = this.parseBlock();
      elseif.push({ test: cond, body });
    }
    let alternate = null;
    if (this.match("ELSE")) {
      this.expect("LBRACE");
      alternate = this.parseBlock();
    }
    return { type: "IfStatement", test, consequent, elseif, alternate };
  }

  parseBlock() {
    const body = [];
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      body.push(this.parseStatement());
    }
    this.expect("RBRACE");
    return body;
  }

  parseWhile() {
    this.expect("WHILE");
    const test = this.parseExpression();
    this.expect("LBRACE");
    const body = this.parseBlock();
    return { type: "WhileStatement", test, body };
  }

  parseFor() {
    this.expect("FOR");
    let init = null;
    if (this.peek().type === "VAR") init = this.parseVarDecl();
    else init = this.parseExpressionStatement();
    this.expect("SEMI");
    const test = this.parseExpression();
    this.expect("SEMI");
    const update = this.parseExpression();
    this.expect("LBRACE");
    const body = this.parseBlock();
    return { type: "ForStatement", init, test, update, body };
  }

  parseForeach() {
    this.expect("FOREACH");
    const item = this.expect("IDENT").value;
    this.expect("IN");
    const iterable = this.parseExpression();
    this.expect("LBRACE");
    const body = this.parseBlock();
    return { type: "ForeachStatement", item, iterable, body };
  }

  parseFunc() {
    this.expect("FUNC");
    const name = this.expect("IDENT").value;
    this.expect("LPAREN");
    const params = [];
    if (this.peek().type !== "RPAREN") {
      params.push(this.expect("IDENT").value);
      while (this.match("COMMA")) params.push(this.expect("IDENT").value);
    }
    this.expect("RPAREN");
    this.expect("LBRACE");
    const body = this.parseBlock();
    return { type: "FunctionDeclaration", name, params, body };
  }

  parseReturn() {
    this.expect("RETURN");
    const value = this.parseExpression();
    return { type: "ReturnStatement", value };
  }

  parseSwitch() {
    this.expect("SWITCH");
    const disc = this.parseExpression();
    this.expect("LBRACE");
    const cases = []; let def = null;
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      if (this.match("CASE")) {
        const test = this.parseExpression();
        this.expect("LBRACE");
        cases.push({ test, body: this.parseBlock() });
      } else if (this.match("DEFAULT")) {
        this.expect("LBRACE");
        def = this.parseBlock();
      } else break;
    }
    this.expect("RBRACE");
    return { type: "SwitchStatement", disc, cases, default: def };
  }

  parseTry() {
    this.expect("TRY");
    this.expect("LBRACE");
    const tryBlock = this.parseBlock();
    this.expect("CATCH");
    this.expect("LPAREN");
    const errName = this.expect("IDENT").value;
    this.expect("RPAREN");
    this.expect("LBRACE");
    const catchBlock = this.parseBlock();
    return { type: "TryCatch", tryBlock, errName, catchBlock };
  }

  parseClass() {
    this.next(); // CLASS or ABSTRACT
    const name = this.expect("IDENT").value;
    let superClass = null;
    if (this.match("EXTENDS")) superClass = this.expect("IDENT").value;
    this.expect("LBRACE");
    const body = [];
    while (this.peek().type !== "RBRACE" && this.peek().type !== "EOF") {
      body.push(this.parseStatement());
    }
    this.expect("RBRACE");
    return { type: "ClassDeclaration", name, superClass, body };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    return expr;
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseLogicalOr();
    if (this.peek().type === "OP" && this.peek().value === "=") {
      this.next();
      const right = this.parseAssignment();
      if (left.type === "Identifier") return { type: "Assignment", name: left.name, value: right };
      if (left.type === "IndexExpression") return { type: "Assignment", target: left, value: right };
      if (left.type === "MemberExpression") return { type: "MemberAssignment", object: left.object, property: left.property, value: right };
    }
    return left;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.peek().type === "OP" && this.peek().value === "||") {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseLogicalAnd() };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.peek().type === "OP" && this.peek().value === "&&") {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseEquality() };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.peek().type === "OP" && ["==", "!="].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseComparison() };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAddSub();
    while (this.peek().type === "OP" && ["<", ">", "<=", ">="].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseAddSub() };
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.peek().type === "OP" && ["+", "-"].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (this.peek().type === "OP" && ["*", "/", "%"].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "BinaryExpression", operator: op, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === "OP" && this.peek().value === "!") {
      this.next();
      return { type: "UnaryExpression", operator: "!", argument: this.parseUnary() };
    }
    if (this.peek().type === "OP" && this.peek().value === "-") {
      this.next();
      return { type: "UnaryExpression", operator: "-", argument: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.peek().type === "LPAREN") {
        this.next();
        const args = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.parseExpression());
          while (this.match("COMMA")) args.push(this.parseExpression());
        }
        this.expect("RPAREN");
        expr = { type: "CallExpression", callee: expr, arguments: args };
      } else if (this.peek().type === "LBRACKET") {
        this.next();
        const index = this.parseExpression();
        this.expect("RBRACKET");
        expr = { type: "IndexExpression", array: expr, index };
      } else if (this.peek().type === "DOT") {
        this.next();
        const property = this.expect("IDENT").value;
        expr = { type: "MemberExpression", object: expr, property };
      } else break;
    }
    return expr;
  }

  parsePrimary() {
    const tok = this.peek();

    if (tok.type === "NUMBER") { this.next(); return { type: "Literal", value: tok.value }; }
    if (tok.type === "STRING") { this.next(); return { type: "Literal", value: tok.value }; }
    if (tok.type === "TRUE")   { this.next(); return { type: "Literal", value: true }; }
    if (tok.type === "FALSE")  { this.next(); return { type: "Literal", value: false }; }
    if (tok.type === "NULL")   { this.next(); return { type: "Literal", value: null }; }
    if (tok.type === "THIS")   { this.next(); return { type: "ThisExpression" }; }

    if (tok.type === "NEW") {
      this.next();
      const cls = this.expect("IDENT").value;
      this.expect("LPAREN");
      const args = [];
      if (this.peek().type !== "RPAREN") {
        args.push(this.parseExpression());
        while (this.match("COMMA")) args.push(this.parseExpression());
      }
      this.expect("RPAREN");
      return { type: "NewExpression", class: cls, arguments: args };
    }

    if (tok.type === "LBRACKET") {
      this.next();
      const elements = [];
      if (this.peek().type !== "RBRACKET") {
        elements.push(this.parseExpression());
        while (this.match("COMMA")) elements.push(this.parseExpression());
      }
      this.expect("RBRACKET");
      return { type: "ArrayExpression", elements };
    }

    if (tok.type === "LPAREN") {
      this.next();
      const expr = this.parseExpression();
      this.expect("RPAREN");
      return expr;
    }

    if (tok.type === "IDENT") {
      this.next();
      return { type: "Identifier", name: tok.value };
    }

    throw new Error(`Token inattendu : '${tok.value || tok.type}' (ligne ${tok.line})`);
  }
}

// ============================================================
// ENVIRONMENT
// ============================================================
class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.values = Object.create(null);
  }
  define(name, value) { this.values[name] = value; }
  assign(name, value) {
    if (Object.prototype.hasOwnProperty.call(this.values, name)) { this.values[name] = value; return; }
    if (this.parent) { this.parent.assign(name, value); return; }
    throw new Error(`Variable non définie : ${name}`);
  }
  get(name) {
    if (Object.prototype.hasOwnProperty.call(this.values, name)) return this.values[name];
    if (this.parent) return this.parent.get(name);
    throw new Error(`Variable non définie : ${name}`);
  }
}

class ReturnException { constructor(value) { this.value = value; } }
class BreakException {}

// ============================================================
// INTERPRETER
// ============================================================
function evaluate(node, env) {
  if (!node) return undefined;

  switch (node.type) {
    case "Program": {
      let r;
      for (const s of node.body) r = evaluate(s, env);
      return r;
    }

    case "VarDeclaration": {
      const v = evaluate(node.value, env);
      env.define(node.name, v);
      return v;
    }

    case "Assignment": {
      if (node.target && node.target.type === "IndexExpression") {
        const arr = evaluate(node.target.array, env);
        const idx = evaluate(node.target.index, env);
        const val = evaluate(node.value, env);
        arr[idx] = val;
        return val;
      }
      const v = evaluate(node.value, env);
      env.assign(node.name, v);
      return v;
    }

    case "MemberAssignment": {
      const obj = evaluate(node.object, env);
      const val = evaluate(node.value, env);
      obj[node.property] = val;
      return val;
    }

    case "PrintStatement": {
      const v = evaluate(node.value, env);
      return v;
    }

    case "IfStatement": {
      if (truthy(evaluate(node.test, env))) return evalBlock(node.consequent, env);
      for (const part of node.elseif || []) {
        if (truthy(evaluate(part.test, env))) return evalBlock(part.body, env);
      }
      if (node.alternate) return evalBlock(node.alternate, env);
      return undefined;
    }

    case "WhileStatement": {
      let r;
      let safety = 0;
      while (truthy(evaluate(node.test, env))) {
        if (++safety > 10000) throw new Error("Boucle infinie détectée (limite 10 000 itérations)");
        try { r = evalBlock(node.body, env); }
        catch (e) { if (e instanceof BreakException) break; throw e; }
      }
      return r;
    }

    case "ForStatement": {
      const loopEnv = new Environment(env);
      if (node.init.type === "VarDeclaration") {
        loopEnv.define(node.init.name, evaluate(node.init.value, loopEnv));
      } else {
        evaluate(node.init, loopEnv);
      }
      let safety = 0;
      while (truthy(evaluate(node.test, loopEnv))) {
        if (++safety > 10000) throw new Error("Boucle infinie (limite 10 000)");
        try { evalBlock(node.body, new Environment(loopEnv)); }
        catch (e) { if (e instanceof BreakException) break; throw e; }
        // update
        evaluate(node.update, loopEnv);
      }
      return undefined;
    }

    case "ForeachStatement": {
      const iterable = evaluate(node.iterable, env);
      if (!Array.isArray(iterable)) throw new Error("fole (foreach) nécessite une liste");
      for (const item of iterable) {
        const inner = new Environment(env);
        inner.define(node.item, item);
        try { evalBlock(node.body, inner); }
        catch (e) { if (e instanceof BreakException) break; throw e; }
      }
      return undefined;
    }

    case "BreakStatement":
      throw new BreakException();

    case "FunctionDeclaration":
      env.define(node.name, { type: "Function", name: node.name, params: node.params, body: node.body, env });
      return undefined;

    case "ReturnStatement":
      throw new ReturnException(evaluate(node.value, env));

    case "CallExpression": {
      const fn = evaluate(node.callee, env);
      const args = node.arguments.map(a => evaluate(a, env));
      if (typeof fn === "function") return fn(...args);
      if (fn && fn.type === "Function") {
        const local = new Environment(fn.env);
        fn.params.forEach((p, i) => local.define(p, args[i]));
        try { return evalBlock(fn.body, local); }
        catch (e) { if (e instanceof ReturnException) return e.value; throw e; }
      }
      throw new Error(`Appel de fonction invalide`);
    }

    case "NewExpression": {
      const cls = env.get(node.class);
      if (!cls || cls.type !== "Class") throw new Error(`Classe non définie : ${node.class}`);
      const instance = { __class__: cls };
      // init prototype methods
      for (const [key, val] of Object.entries(cls.methods)) {
        instance[key] = { type: "BoundMethod", fn: val, instance };
      }
      const ctor = cls.methods["__constructor__"];
      if (ctor) {
        const local = new Environment(ctor.env);
        local.define("nin", instance);
        ctor.params.forEach((p, i) => local.define(p, node.arguments.map(a => evaluate(a, env))[i]));
        try { evalBlock(ctor.body, local); } catch (e) { if (!(e instanceof ReturnException)) throw e; }
      }
      return instance;
    }

    case "ClassDeclaration": {
      const methods = {};
      const classEnv = new Environment(env);
      for (const stmt of node.body) {
        if (stmt.type === "FunctionDeclaration") {
          methods[stmt.name] = { type: "Function", name: stmt.name, params: stmt.params, body: stmt.body, env: classEnv };
        }
      }
      const cls = { type: "Class", name: node.name, methods };
      env.define(node.name, cls);
      return undefined;
    }

    case "SwitchStatement": {
      const disc = evaluate(node.disc, env);
      let matched = false;
      for (const c of node.cases) {
        if (!matched && disc === evaluate(c.test, env)) matched = true;
        if (matched) {
          try { evalBlock(c.body, env); } catch (e) { if (e instanceof BreakException) return; throw e; }
          break;
        }
      }
      if (!matched && node.default) {
        try { evalBlock(node.default, env); } catch (e) { if (!(e instanceof BreakException)) throw e; }
      }
      return undefined;
    }

    case "TryCatch": {
      try { evalBlock(node.tryBlock, env); }
      catch (e) {
        if (e instanceof ReturnException || e instanceof BreakException) throw e;
        const catchEnv = new Environment(env);
        catchEnv.define(node.errName, e.message || String(e));
        evalBlock(node.catchBlock, catchEnv);
      }
      return undefined;
    }

    case "ThrowStatement":
      throw new Error(String(evaluate(node.argument, env)));

    case "Literal": return node.value;
    case "Identifier": return env.get(node.name);

    case "ThisExpression": return env.get("nin");

    case "UnaryExpression": {
      const val = evaluate(node.argument, env);
      if (node.operator === "!") return !truthy(val);
      if (node.operator === "-") return -val;
      return val;
    }

    case "BinaryExpression": {
      const L = evaluate(node.left, env);
      const R = evaluate(node.right, env);
      switch (node.operator) {
        case "+": return L + R;
        case "-": return L - R;
        case "*": return L * R;
        case "/": return R === 0 ? "Erreur: division par zéro" : L / R;
        case "%": return L % R;
        case "==": return L == R;
        case "!=": return L != R;
        case "<": return L < R;
        case ">": return L > R;
        case "<=": return L <= R;
        case ">=": return L >= R;
        case "&&": return truthy(L) && truthy(R);
        case "||": return truthy(L) || truthy(R);
        default: throw new Error(`Opérateur inconnu: ${node.operator}`);
      }
    }

    case "ArrayExpression":
      return node.elements.map(e => evaluate(e, env));

    case "IndexExpression": {
      const arr = evaluate(node.array, env);
      const idx = evaluate(node.index, env);
      if (Array.isArray(arr)) return arr[idx];
      if (typeof arr === "string") return arr[idx];
      throw new Error("Indexation uniquement sur listes ou chaînes");
    }

    case "MemberExpression": {
      const obj = evaluate(node.object, env);
      if (obj === null || obj === undefined) throw new Error(`Impossible d'accéder à '${node.property}' sur null`);
      if (typeof obj === "string") {
        if (node.property === "longueur" || node.property === "length") return obj.length;
      }
      if (Array.isArray(obj)) {
        if (node.property === "longueur" || node.property === "length") return obj.length;
        if (node.property === "ajouter" || node.property === "push") return (...args) => { obj.push(...args); return obj.length; };
      }
      if (obj && obj[node.property] !== undefined) {
        const val = obj[node.property];
        if (val && val.type === "BoundMethod") {
          return (...args) => {
            const local = new Environment(val.fn.env);
            local.define("nin", obj);
            val.fn.params.forEach((p, i) => local.define(p, args[i]));
            try { return evalBlock(val.fn.body, local); }
            catch (e) { if (e instanceof ReturnException) return e.value; throw e; }
          };
        }
        if (val && val.type === "Function") {
          return (...args) => {
            const local = new Environment(val.env);
            local.define("nin", obj);
            val.params.forEach((p, i) => local.define(p, args[i]));
            try { return evalBlock(val.body, local); }
            catch (e) { if (e instanceof ReturnException) return e.value; throw e; }
          };
        }
        return val;
      }
      return undefined;
    }

    default:
      throw new Error(`Nœud AST inconnu : ${node.type}`);
  }
}

function evalBlock(statements, parentEnv) {
  const env = new Environment(parentEnv);
  let r;
  for (const s of statements) r = evaluate(s, env);
  return r;
}

function truthy(v) { return !!v; }

function createGlobalEnv(outputCallback) {
  const env = new Environment();
  env.define("sebeni", (...args) => { outputCallback(args.map(String).join(" ")); return args[0]; });
  env.define("kake", (...args)  => { outputCallback(args.map(String).join(" ")); return args[0]; });
  env.define("taille", (arr) => Array.isArray(arr) ? arr.length : String(arr).length);
  env.define("nombre", (v)   => Number(v));
  env.define("texte",  (v)   => String(v));
  env.define("liste",  (...args) => args);
  env.define("Math", {
    plancher: Math.floor, plafond: Math.ceil, arrondi: Math.round,
    racine: Math.sqrt, abs: Math.abs, max: Math.max, min: Math.min,
    aleatoire: Math.random
  });
  return env;
}

// ============================================================
// EXPORTED RUNNER
// ============================================================
export function runMaliLangInterpreter(code, outputCallback) {
  const outputs = [];
  const capture = (line) => { outputs.push(line); outputCallback(line); };

  try {
    const tokens = lexer(code);
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    const env = createGlobalEnv(capture);

    // Premier passage : collecter les PrintStatements
    function runWithPrint(node, env) {
      if (!node) return;
      if (node.type === "Program") {
        for (const s of node.body) runWithPrint(s, env);
      } else if (node.type === "PrintStatement") {
        const v = evaluate(node.value, env);
        capture(String(v));
      } else {
        evaluate(node, env);
      }
    }

    // Réévaluer avec capture de sebeni inline
    for (const stmt of ast.body) {
      if (stmt.type === "PrintStatement") {
        const v = evaluate(stmt.value, env);
        capture(String(v));
      } else {
        evaluate(stmt, env);
      }
    }

    if (outputs.length === 0) {
      outputCallback("[Programme exécuté sans sortie console]");
    }
  } catch (err) {
    outputCallback(`[MaliLang Erreur]: ${err.message}`);
  }
}
