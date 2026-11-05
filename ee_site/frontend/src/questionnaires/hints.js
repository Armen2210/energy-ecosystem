// Examples describe the scope of a value, never engineering defaults.
export const hints = {
  "vns.technical.flow": "Общий расход основных насосов, без резервных",
  "pns.technical.flow": "Общий расход основных пожарных насосов",
  "pns.technical.jockey_flow": "Подача только жокей-насоса",
  "bmk.loads.dhw_max": "Пиковая нагрузка на горячее водоснабжение",
  "bmk.loads.dhw_average": "Среднечасовая нагрузка на горячее водоснабжение",
  "btp.common.winter_supply": "Подача теплосети на вводе БТП зимой",
  "btp.common.winter_return": "Обратка теплосети на вводе БТП зимой",
  "btp.common.diameter": "Диаметр ввода теплосети",
};
export function fieldHint(path) { return hints[path]; }
