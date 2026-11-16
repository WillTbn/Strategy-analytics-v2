const state = () => {
  return {
    data: [],
    editData: {
      id: "",
    },
    isDirtyReport: {},
    stepHighPerfomance: 1,
    highPerfomance: {objective:null,time:null,modality:null,amount:null,amount_mensal:null,types:[],regions:[]},
  };
};

export default state;
