import json
main = json.loads(open('../../vendor/TurnBasedGameData/ExcelOutput/AvatarSkillConfig.json', encoding='utf-8').read())
ld = json.loads(open('../../vendor/TurnBasedGameData/ExcelOutput/AvatarSkillConfigLD.json', encoding='utf-8').read())
all_skills = main + ld
for sid in [130801, 130802, 130803, 130804, 130806, 130807, 130814, 130815, 130816, 130817]:
    found = [x for x in all_skills if x['SkillID'] == sid]
    if found:
        sk = found[0]
        print(f'{sid}: HideInUI={sk.get("HideInUI", "MISSING")}, SkillTriggerKey={sk.get("SkillTriggerKey","")}, SkillEffect={sk.get("SkillEffect","")}, has_Desc={"SkillDesc" in sk}')
