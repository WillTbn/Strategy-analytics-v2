import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as assets from "../src/services/communicationDirectoryAssets.js";
import * as announcements from "../src/services/clientAnnouncements.js";
async function mount(file, overrides = {}) {
  const context = vm.createContext({ console, Function });
  const module = new vm.SourceTextModule(
    compileScript(parse(readFileSync(file, "utf8")).descriptor, {
      id: file,
    }).content,
    { context },
  );
  const deps = {
    vue: Vue,
    "src/services/communicationDirectoryAssets": assets,
    "src/services/clientAnnouncements": announcements,
  };
  await module.link(async (name) => {
    const values = deps[name] || { default: {} };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const key in values) this.setExport(key, values[key]);
      },
      { context },
    );
  });
  await module.evaluate();
  const props = Vue.reactive({
      state: { data: null, loading: false, error: "" },
      preview: false,
      tab: "",
      page: 1,
      layout: "list",
      draft: { category: null, periodDays: null, unread: false },
      image: null,
      ...overrides,
    }),
    events = [],
    scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, {
      expose() {},
      emit: (...args) => events.push(args),
    }),
  );
  return { props, h, events, stop: () => scope.stop() };
}
const directory = "src/system/layouts/communication/CommunicationDirectory.vue";
test("directory emits draft and view changes without mutating supplied filters or invoking HTTP", async () => {
  const f = await mount(directory);
  f.h.categoryModel.value = "Financial";
  assert.equal(f.props.draft.category, null);
  assert.equal(f.events[0][0], "update:draft");
  assert.equal(f.events[0][1].category, "Financial");
  f.h.pageModel.value = 2;
  assert.equal(f.props.page, 1);
  assert.equal(f.events[1][0], "update:page");
  assert.equal(f.events[1][1], 2);
  f.h.layoutModel.value = "grid";
  assert.equal(f.events[2][1], "grid");
  f.stop();
});
test("unavailable consultation is not an empty confirmed list and invalid pagination cannot create pages", async () => {
  const f = await mount(directory);
  assert.equal(f.h.validList.value, false);
  assert.equal(f.h.pages.value, 1);
  f.props.state = {
    data: { data: [], pagination: { totalPages: 0 } },
    loading: false,
    error: "",
  };
  assert.equal(f.h.validList.value, true);
  assert.equal(f.h.items.value.length, 0);
  assert.equal(f.h.pages.value, 1);
  f.props.state.data = { data: [{ id: "qa" }], pagination: { totalPages: 5 } };
  assert.equal(f.h.items.value.length, 1);
  assert.equal(f.h.pages.value, 5);
  f.props.state.data = { data: { unexpected: "data" } };
  assert.equal(f.h.validList.value, false);
  f.stop();
});
test("operations preserve zero, reject invalid values and tolerate missing parity and profit", async () => {
  const f = await mount("src/system/layouts/contracts/OperationTable.vue");
  assert.equal(f.h.display(0), "0");
  for (const value of [null, undefined, false, NaN, {}, [], Infinity, " "])
    assert.equal(f.h.display(value), "—");
  assert.equal(f.h.parity(null).name, "—");
  assert.equal(f.h.parity("BRL/USD Long").side, "Long");
  assert.equal(f.h.parity("BRL/USD Short").side, "Short");
  assert.equal(f.h.profitClass("+2%"), "operation-profit");
  assert.equal(f.h.profitClass("-1%"), "operation-loss");
  assert.equal(f.h.profitClass(0), "");
  f.stop();
});
test("list dates follow the approved short-year presentation without displaying epoch for missing dates", () => {
  assert.match(
    assets.communicationDate("2026-11-18T09:36:00Z"),
    /^18\/11\/26 - \d{2}:\d{2}$/,
  );
  for (const value of [null, false, 0, "", "invalid", {}])
    assert.equal(assets.communicationDate(value), "—");
});
test("a failed thumbnail can recover when another real image is supplied", async () => {
  const f = await mount(
    "src/system/layouts/communication/CommunicationResumeLayout.vue",
    { image: "qa-before.png" },
  );
  f.h.imageFailed.value = true;
  f.props.image = "qa-after.png";
  await Vue.nextTick();
  assert.equal(f.h.imageFailed.value, false);
  f.stop();
});
