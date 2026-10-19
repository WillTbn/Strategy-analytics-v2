import { test } from "node:test";
import assert from "node:assert/strict";
import {
  profileFields,
  profileMoney,
  profileDate,
  identityApproved,
  NOT_INFORMED,
} from "../src/services/profilePresentation.js";
import { sessionRows } from "../src/services/profileSessions.js";
import {
  basicProfilePatch,
  locationProfilePatch,
} from "../src/services/profileEdit.js";

test("missing profile data never becomes example identity, money or documents", () => {
  const f = profileFields();
  for (const fields of [
    f.basic,
    f.document,
    f.location,
    f.job,
    ...f.trusted,
    f.summaryBasic,
    f.summaryJob,
  ]) {
    assert.ok(fields.every((field) => field.value === NOT_INFORMED));
  }
});
test("summary and full profile share real financial values and preserve zero", () => {
  const f = profileFields(
    { displayName: "Cliente API" },
    { occupation: "Analista" },
    {
      individualMonthlyIncome: 0,
      householdMonthlyIncome: 18000,
      declaredNetWorth: 450000,
      currencyCode: "BRL",
    },
  );
  assert.equal(f.basic[0].value, "Cliente API");
  assert.equal(f.summaryJob[1].value, f.job[1].value);
  assert.match(f.job[1].value, /0,00/);
  assert.match(f.job[2].value, /18.000,00/);
  assert.match(f.job[3].value, /450.000,00/);
  assert.equal(profileMoney(null, "BRL"), NOT_INFORMED);
  assert.equal(profileMoney(0, null), NOT_INFORMED);
});
test("only masked document numbers are presented and address complement is not a neighborhood", () => {
  const f = profileFields({
    identificationDocuments: {
      documents: [
        { documentCode: "CPF", number: "raw-sensitive-number" },
        {
          documentCode: "RG",
          numberMasked: "***.***-12",
          issuer: "SSP",
          issuedOn: "2020-06-12",
        },
      ],
    },
    residentialAddress: { line1: "Endereço API", line2: "Complemento API" },
  });
  assert.equal(f.document[0].value, NOT_INFORMED);
  assert.equal(f.document[1].value, "***.***-12");
  assert.equal(f.location[4].value, NOT_INFORMED);
  assert.equal(f.location[5].value, "Complemento API");
  assert.ok(!JSON.stringify(f).includes("raw-sensitive-number"));
});
test("dates preserve the API calendar day and reject malformed values", () => {
  assert.equal(profileDate("2026-08-04T00:00:00Z"), "04/08/2026");
  assert.equal(profileDate("2026-08-04T14:25:07-03:00"), "04/08/2026");
  assert.equal(profileDate("1994-05-08"), "08/05/1994");
  assert.equal(profileDate("2026-02-31"), NOT_INFORMED);
  assert.equal(profileDate(null), NOT_INFORMED);
});
test("a level, waived requirement or approved tax document does not unlock identity editing", () => {
  assert.equal(identityApproved({ documentLevel: 3 }), false);
  assert.equal(
    identityApproved({
      identificationDocuments: {
        documents: [{ documentCode: "CPF", status: "Approved" }],
      },
    }),
    false,
  );
  assert.equal(
    identityApproved(
      {},
      {
        sections: [
          {
            requirements: [
              {
                documentTypeCode: "CNH",
                countsAsComplete: true,
                documentStatus: "Waived",
              },
            ],
          },
        ],
      },
    ),
    false,
  );
  assert.equal(
    identityApproved(
      {},
      {
        sections: [
          {
            requirements: [
              { documentTypeCode: "CNH", documentStatus: "Approved" },
            ],
          },
        ],
      },
    ),
    true,
  );
  assert.equal(
    identityApproved({
      identificationDocuments: {
        documents: [{ documentCode: "PASSPORT", status: "Approved" }],
      },
    }),
    true,
  );
});
test("session rows use real time and device, mask IP and never invent location", () => {
  const rows = sessionRows([
    {
      sessionId: "session",
      createdAtUtc: "2026-10-19T15:00:00Z",
      ipAddress: "192.168.1.20",
      userAgent: "API device",
      isCurrent: true,
    },
  ]);
  assert.match(rows[0].date, /19\/10\/2026.*12:00:00/);
  assert.equal(rows[0].equipment, "API device");
  assert.equal(rows[0].ip, "192.168.***.***");
  assert.equal(rows[0].local, NOT_INFORMED);
  assert.equal(rows[0].isCurrent, true);
  assert.equal(sessionRows([{ createdAtUtc: null }])[0].date, NOT_INFORMED);
});
const profile = {
  birthDate: "1990-01-01",
  names: [
    {
      id: "main",
      kind: "Legal",
      displayName: "Nome API",
      validFrom: "2020-01-01",
      validTo: null,
      isPrimary: true,
    },
    {
      id: "other",
      kind: "Alias",
      displayName: "Outro Nome",
      validFrom: "2020-01-01",
      validTo: null,
      isPrimary: false,
    },
  ],
  contacts: [
    {
      id: "email",
      kind: "Email",
      value: "client@example.com",
      isPrimary: true,
    },
    {
      id: "phone",
      kind: "MobilePhone",
      value: "+551100000000",
      isPrimary: true,
    },
  ],
  addresses: [
    {
      id: "home",
      kind: "Residential",
      isPrimary: true,
      countryId: "BR",
      line1: "Antigo",
      line2: "Complemento",
      city: "Cidade",
      stateOrProvince: "SP",
      postalCode: "00000000",
    },
  ],
  personalDetails: {
    gender: "Male",
    motherName: "Mãe API",
    birthCity: "Cidade",
    birthState: "SP",
  },
};
test("editing location preserves country, birthday, names, contacts and personal details", () => {
  const result = locationProfilePatch(profile, {
    line1: "Novo",
    line2: "Complemento",
    city: "Cidade",
    stateOrProvince: "SP",
    postalCode: "00000000",
    neighborhood: "ignored",
  });
  assert.equal(result.birthDate, profile.birthDate);
  assert.deepEqual(result.names, profile.names);
  assert.deepEqual(result.contacts, profile.contacts);
  assert.equal(result.addresses[0].countryId, "BR");
  assert.equal(result.addresses[0].line1, "Novo");
  assert.ok(!("neighborhood" in result.addresses[0]));
  assert.equal(result.personalDetails.motherName, "Mãe API");
});
test("editing basic data keeps secondary names and addresses and never guesses a contact kind", () => {
  const draft = {
    name: "Nome editado",
    birthDate: "1990-01-01",
    email: "new@example.com",
    phone: "+551100000000",
    birthPlace: "Cidade, SP",
  };
  const result = basicProfilePatch(profile, draft);
  assert.deepEqual(result.names[1], profile.names[1]);
  assert.deepEqual(result.addresses, profile.addresses);
  assert.equal(result.contacts[0].value, "new@example.com");
  assert.throws(
    () => basicProfilePatch({ ...profile, contacts: [] }, draft),
    /tipo definido/,
  );
  assert.throws(
    () => basicProfilePatch({ ...profile, names: [] }, draft),
    /nome principal/,
  );
});
