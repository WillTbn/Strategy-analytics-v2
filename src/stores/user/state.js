const state = () => {
  return {
    login: {
      person: "",
      password: "",
      expiration: null,
    },
    authentication: {
      token: "",
      person: "",
      password: "",
      password_confirm: "",
      password_confirmation: "",
    },
    level: 1,
    assets: 2,
    register: {
      notifications: "refused"
    },
    accountEdit: {},
    data: {},
    loan: {},
    wallet: {},
    investment: {},
    abilities: [],
    routeHome: "inicio",
    NavbarMenu: "adm",
    isDirty: {},
    isDirtyData: {},
    walletChart: [],
    stepCash: 1,
    cash: {
      ammount: "",
      account: ""
    },
    vehicles: {
      paid_off: false
    },
    investmentsAdd: {
      term: false
    },
    consortium: {},
    imovel: {
      paid_off: false
    },
    location: {
      // "place_id": 396343688,
      // "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright", "osm_type": "way", "osm_id": 1349614198, "lat": "-22.9671698", "lon": "-43.3851176", "class": "leisure", "type": "pitch", "place_rank": 30, "importance": 0.00008152666514071897, "addresstype": "leisure", "name": "", "display_name": "Alameda Oswaldo Cardozo, Cidade Jardim, Barra Olímpica, Rio de Janeiro, Região Geográfica Imediata do Rio de Janeiro, Região Metropolitana do Rio de Janeiro, Região Geográfica Intermediária do Rio de Janeiro, Rio de Janeiro, Região Sudeste, 22775-033, Brasil", "address": { "road": "Alameda Oswaldo Cardozo", "quarter": "Cidade Jardim", "suburb": "Barra Olímpica", "city": "Rio de Janeiro", "municipality": "Região Geográfica Imediata do Rio de Janeiro", "county": "Região Metropolitana do Rio de Janeiro", "state_district": "Região Geográfica Intermediária do Rio de Janeiro", "state": "Rio de Janeiro", "ISO3166-2-lvl4": "BR-RJ", "region": "Região Sudeste", "postcode": "22775-033", "country": "Brasil", "country_code": "br" }, "boundingbox": ["-22.9672747", "-22.9670689", "-43.3852884", "-43.3849482"]
    }
  };
};

export default state;
