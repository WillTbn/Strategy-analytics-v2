import test from "node:test";
import assert from "node:assert/strict";
import {
  trustedContactsDraft,
  trustedContactChanges,
  saveTrustedContacts,
} from "../src/services/profileTrustedEdit.js";
const contacts = () => [
  {
    id: "first",
    name: "Contato QA 1",
    phoneNumber: "+55 11 90000-0001",
    relationship: "Sibling",
    email: "qa@example.com",
    other: "preserve",
  },
  {
    id: "second",
    name: "Contato QA 2",
    phoneNumber: "+55 11 90000-0002",
    relationship: null,
    email: null,
  },
];
test("empty profile creates a first contact without inventing relationship or email", async () => {
  const baseline = [];
  const draft = trustedContactsDraft(baseline);
  assert.deepEqual(draft, [{ name: "", phoneNumber: "" }]);
  Object.assign(draft[0], {
    name: " Contato fictício QA ",
    phoneNumber: " +55 11 90000-0000 ",
  });
  const sent = [];
  await saveTrustedContacts(baseline, draft, {
    assertSession() {},
    async create(payload) {
      sent.push(payload);
      return { id: "new-contact" };
    },
    async update() {
      assert.fail("must create");
    },
  });
  assert.deepEqual(sent, [
    {
      name: "Contato fictício QA",
      phoneNumber: "+55 11 90000-0000",
      relationship: null,
      email: null,
    },
  ]);
  assert.equal(baseline[0].id, "new-contact");
});
test("multiple contacts retain IDs and hidden metadata; unchanged rows are not rewritten", () => {
  const baseline = contacts(),
    draft = trustedContactsDraft(baseline);
  draft[1].name = "Contato atualizado QA";
  const changes = trustedContactChanges(baseline, draft);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].id, "second");
  assert.equal(changes[0].payload.relationship, null);
  draft[0].phoneNumber = "+55 11 90000-0003";
  assert.equal(
    trustedContactChanges(baseline, draft)[0].payload.email,
    "qa@example.com",
  );
  assert.equal(
    trustedContactChanges(baseline, draft)[0].payload.relationship,
    "Sibling",
  );
  assert.equal(baseline[0].phoneNumber, "+55 11 90000-0001");
});
test("all contacts are validated before any write; rows cannot be added, removed or rebound", async () => {
  const baseline = contacts(),
    draft = trustedContactsDraft(baseline);
  draft[0].name = "Edited QA";
  for (const invalid of ["", "letters", "   "]) {
    draft[1].phoneNumber = invalid;
    await assert.rejects(
      saveTrustedContacts(baseline, draft, {
        assertSession() {},
        create() {
          assert.fail("no writes");
        },
        update() {
          assert.fail("no writes");
        },
      }),
    );
  }
  for (const invalid of [
    trustedContactsDraft(baseline).slice(0, 1),
    [...trustedContactsDraft(baseline), {}],
    trustedContactsDraft(baseline).reverse(),
  ])
    assert.throws(
      () => trustedContactChanges(baseline, invalid),
      /contatos mudaram/,
    );
});
test("retry skips a confirmed update after a later failure and preserves the draft", async () => {
  const baseline = contacts(),
    draft = trustedContactsDraft(baseline);
  draft.forEach((contact) => (contact.name += " alterado"));
  const snapshot = structuredClone(draft),
    calls = [];
  let fail = true;
  const operations = {
    assertSession() {},
    create() {
      assert.fail();
    },
    async update(id) {
      calls.push(id);
      if (id === "second" && fail) throw Error("indisponível");
    },
  };
  await assert.rejects(
    saveTrustedContacts(baseline, draft, operations),
    /indisponível/,
  );
  assert.equal(baseline[0].name, draft[0].name);
  assert.deepEqual(draft, snapshot);
  fail = false;
  await saveTrustedContacts(baseline, draft, operations);
  assert.deepEqual(calls, ["first", "second", "second"]);
  await saveTrustedContacts(baseline, draft, operations);
  assert.equal(calls.length, 3);
});
test("session change stops the batch and does not confirm another account's data", async () => {
  const baseline = contacts(),
    original = structuredClone(baseline),
    draft = trustedContactsDraft(baseline);
  draft.forEach((contact) => (contact.name += " alterado"));
  let active = true,
    writes = 0;
  await assert.rejects(
    saveTrustedContacts(baseline, draft, {
      assertSession() {
        if (!active) throw Error("sessão alterada");
      },
      async update() {
        writes++;
        active = false;
      },
    }),
    /sessão alterada/,
  );
  assert.equal(writes, 1);
  assert.deepEqual(baseline, original);
});

test("the real profile template uses only the existing name/phone pair and section actions", async () => {
  const { readFileSync } = await import("node:fs");
  const { parse, compileTemplate } = await import("@vue/compiler-sfc");
  const Vue = await import("vue");
  const { renderToString } = await import("@vue/server-renderer");
  const { descriptor } = parse(
    readFileSync(
      new URL(
        "../src/system/layouts/config/PersonalSettingLayout.vue",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename: "PersonalSettingLayout.vue",
    id: "trusted-profile",
    compilerOptions: { mode: "function" },
  });
  assert.deepEqual(compiled.errors, []);
  const render = new Function("Vue", compiled.code)(Vue);
  for (const values of [[], contacts()]) {
    const component = {
      render,
      setup: () => ({
        profile: {
          progress: { state: { value: null } },
          catalog: {},
          approved: { value: true },
        },
        editing: "trusted",
        saving: false,
        changed: true,
        saveError: "",
        draft: { contacts: trustedContactsDraft(values) },
        sections: [
          {
            key: "trusted",
            title: "Contatos de Confiança",
            resources: [],
            editFields: [
              { key: "name", title: "Nome Completo do Contato" },
              { key: "phoneNumber", title: "Telefone do Contato" },
            ],
          },
        ],
        fieldClass: () => "col-12 col-sm-6 col-md-6",
        save() {},
        discard() {},
      }),
    };
    const app = Vue.createSSRApp(component);
    app.component("QCard", {
      setup:
        (_, { slots }) =>
        () =>
          Vue.h("section", slots.default?.()),
    });
    app.component("QBtn", {
      props: ["label"],
      setup: (props) => () => Vue.h("button", props.label),
    });
    app.component("LabelForm", {
      props: ["textLabel", "className"],
      setup:
        (props, { slots }) =>
        () =>
          Vue.h("label", { class: props.className }, [
            props.textLabel,
            slots.default?.(),
          ]),
    });
    app.component("QInput", {
      props: ["modelValue", "disable", "type"],
      setup: (props) => () =>
        Vue.h("input", {
          value: props.modelValue,
          disabled: props.disable,
          type: props.type,
        }),
    });
    app.component("ProfileResourceState", { render: () => null });
    const html = await renderToString(app);
    assert.equal(
      (html.match(/<input/g) || []).length,
      (values.length || 1) * 2,
    );
    assert.equal((html.match(/type="tel"/g) || []).length, values.length || 1);
    assert.match(html, />Salvar<\/button>/);
    assert.match(html, />Descartar<\/button>/);
    assert.doesNotMatch(
      html,
      /relationship|Sibling|qa@example.com|Adicionar|Excluir/,
    );
  }
});
