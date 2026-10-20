import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";

async function chartComponent(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { descriptor } = parse(source);
  const script = compileScript(descriptor, { id: "chart-regression" });
  const context = vm.createContext({});
  const vue = new vm.SyntheticModule(Object.keys(Vue), function () {
    for (const [name, value] of Object.entries(Vue)) this.setExport(name, value);
  }, { context });
  const component = new vm.SourceTextModule(script.content, { context });
  await component.link((specifier) => {
    assert.equal(specifier, "vue");
    return vue;
  });
  await component.evaluate();
  return component.namespace.default;
}

for (const name of ["BolsasChart", "RedesChart"]) {
  test(`${name} initializes and follows incoming series without a shared data snapshot`, async () => {
    const component = await chartComponent(`../src/system/components/contract/chart/${name}.vue`);
    const props = Vue.reactive({ datasSeries: [10, 20], colorsArray: [], labelsArray: [], title: "" });
    const state = component.setup(props, { expose() {} });
    assert.deepEqual(Array.from(state.series.value), [10, 20]);
    props.datasSeries = [0, 30];
    assert.deepEqual(Array.from(state.series.value), [0, 30]);
  });
}

test("chart array defaults are isolated for separate component instances", async () => {
  for (const path of [
    "../src/system/components/contract/DistributionChart.vue",
    "../src/system/components/contract/chart/BolsasChart.vue",
    "../src/system/components/contract/chart/RedesChart.vue",
  ]) {
    const component = await chartComponent(path);
    for (const name of ["labelsArray", "colorsArray", "datasSeries"]) {
      const first = component.props[name].default();
      const second = component.props[name].default();
      first.push("modified by another instance");
      assert.notEqual(first.length, second.length, `${path}: ${name}`);
    }
  }
});
