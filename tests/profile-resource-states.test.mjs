import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";

function template(file) {
  const { descriptor } = parse(readFileSync(new URL(file, import.meta.url), "utf8"));
  const result = compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id: "profile-test",
    compilerOptions: { mode: "function" },
  });
  assert.deepEqual(result.errors, []);
  return new Function("Vue", result.code)(Vue);
}
const resource = (value, extra = {}) => ({ state: { value, loading: false, error: "", ...extra }, load() {} });
const ProfileResourceState = {
  props: ["resource"],
  render: template("../src/system/components/setting/ProfileResourceState.vue"),
};
const PersonalSetting = {
  props: ["profile"],
  components: {
    ProfileResourceState,
    ProfileFields: {
      props: ["fields"],
      render() { return Vue.h("dl", this.fields.map((f) => Vue.h("dd", f.value))); },
    },
    QSeparator: { render() { return Vue.h("hr"); } },
    QBtn: { props: ["label"], render() { return Vue.h("button", this.label); } },
    QSpinner: { render() { return Vue.h("span", "spinner"); } },
  },
  render: template("../src/system/components/setting/PersonalSetting.vue"),
};
const profile = () => ({
  summary: resource({}),
  professional: resource({}),
  financial: resource({}),
  fields: { value: {
    summaryBasic: [{ value: "Nome API" }],
    summaryLocation: [{ value: "Local API" }],
    summaryJob: [{ value: "Não informado" }, { value: "R$ 0,00" }],
  } },
});
const render = (p) => {
  const app = Vue.createSSRApp(PersonalSetting, { profile: p });
  app.component("QBtn", PersonalSetting.components.QBtn);
  app.component("QSpinner", PersonalSetting.components.QSpinner);
  return renderToString(app);
};
test("an error in either work resource shows retry without rendering missing data or zero amounts", async () => {
  for (const key of ["professional", "financial"]) {
    const p = profile();
    p[key] = resource(null, { error: "Consulta indisponível" });
    const html = await render(p);
    assert.match(html, /Consulta indisponível/);
    assert.match(html, /<button[^>]*>Tentar novamente<\/button>/);
    assert.match(html, /Nome API/);
    assert.match(html, /Local API/);
    assert.doesNotMatch(html, /Não informado|R\$ 0,00/);
  }
});
test("loading hides work fields and a successful retry restores actual missing and zero values", async () => {
  const p = profile();
  p.financial.state.loading = true;
  const pending = await render(p);
  assert.match(pending, /Carregando/);
  assert.doesNotMatch(pending, /R\$ 0,00/);
  p.financial.state.loading = false;
  const loaded = await render(p);
  assert.match(loaded, /Não informado/);
  assert.match(loaded, /R\$ 0,00/);
});
