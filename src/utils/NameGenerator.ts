// ============================================================
// PIXEL EARTH — Name Generator
// Generates random human names. Data-driven: swap lists for mods.
// ============================================================

const MALE_FIRST: string[] = [
  'Aiden','Ben','Carlos','David','Eli','Finn','George','Hassan','Ivan','James',
  'Kai','Luca','Marco','Nathan','Oscar','Pedro','Quinn','Rafael','Sam','Theo',
  'Umar','Victor','William','Xander','Yusuf','Zane','Arjun','Boris','Caleb','Dylan',
];

const FEMALE_FIRST: string[] = [
  'Amara','Bella','Clara','Diana','Eva','Fiona','Grace','Hannah','Iris','Julia',
  'Kira','Luna','Maya','Nadia','Olivia','Priya','Quinn','Rosa','Sofia','Tara',
  'Uma','Valentina','Wren','Xena','Yara','Zoe','Aisha','Bianca','Chloe','Dani',
];

const OTHER_FIRST: string[] = [
  'Ash','Blake','Cameron','Drew','Eden','Finley','Gray','Harley','Indigo','Jesse',
  'Kit','Lee','Morgan','Nova','Oakley','Parker','Reece','Sage','Taylor','Umber',
];

const LAST_NAMES: string[] = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Lopez','Wilson',
  'Martinez','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','White','Harris',
  'Clark','Lewis','Robinson','Walker','Hall','Allen','Young','King','Wright','Hill',
  'Scott','Green','Baker','Adams','Nelson','Carter','Mitchell','Perez','Roberts','Turner',
];

class NameGenerator {
  generate(gender: 'male' | 'female' | 'other'): string {
    const firstList =
      gender === 'male' ? MALE_FIRST :
      gender === 'female' ? FEMALE_FIRST : OTHER_FIRST;

    const first = firstList[Math.floor(Math.random() * firstList.length)];
    const last  = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
  }
}

export const nameGenerator = new NameGenerator();
