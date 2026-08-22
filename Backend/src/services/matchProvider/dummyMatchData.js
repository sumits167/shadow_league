// Realistic cricket matches and eligible player pools for Shadowleague
// This dummy provider simulates the exact structure returned by professional cricket data APIs

export const DUMMY_MATCHES = [
  {
    id: "match_ind_aus_2026_01",
    name: "India vs Australia",
    series: "T20 Super Series 2026",
    format: "T20",
    venue: "Wankhede Stadium, Mumbai",
    matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
    lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 30).toISOString(),
    status: "Upcoming",
    team1: {
      name: "India",
      shortName: "IND",
      code: "IND",
      logo: "🇮🇳"
    },
    team2: {
      name: "Australia",
      shortName: "AUS",
      code: "AUS",
      logo: "🇦🇺"
    },
    squad: [
      // India Squad
      { id: "p_ind_01", name: "Virat Kohli", realTeam: "IND", position: "BAT", price: 12.0, ownershipLimit: 5 },
      { id: "p_ind_02", name: "Rohit Sharma", realTeam: "IND", position: "BAT", price: 11.5, ownershipLimit: 5 },
      { id: "p_ind_03", name: "Suryakumar Yadav", realTeam: "IND", position: "BAT", price: 11.0, ownershipLimit: 5 },
      { id: "p_ind_04", name: "Shubman Gill", realTeam: "IND", position: "BAT", price: 10.5, ownershipLimit: 5 },
      { id: "p_ind_05", name: "Yashasvi Jaiswal", realTeam: "IND", position: "BAT", price: 10.0, ownershipLimit: 5 },
      { id: "p_ind_06", name: "Rishabh Pant", realTeam: "IND", position: "WK", price: 10.5, ownershipLimit: 5 },
      { id: "p_ind_07", name: "KL Rahul", realTeam: "IND", position: "WK", price: 10.0, ownershipLimit: 5 },
      { id: "p_ind_08", name: "Hardik Pandya", realTeam: "IND", position: "AR", price: 11.0, ownershipLimit: 5 },
      { id: "p_ind_09", name: "Ravindra Jadeja", realTeam: "IND", position: "AR", price: 10.5, ownershipLimit: 5 },
      { id: "p_ind_10", name: "Axar Patel", realTeam: "IND", position: "AR", price: 9.5, ownershipLimit: 5 },
      { id: "p_ind_11", name: "Jasprit Bumrah", realTeam: "IND", position: "BOWL", price: 12.0, ownershipLimit: 5 },
      { id: "p_ind_12", name: "Mohammed Siraj", realTeam: "IND", position: "BOWL", price: 9.5, ownershipLimit: 5 },
      { id: "p_ind_13", name: "Kuldeep Yadav", realTeam: "IND", position: "BOWL", price: 9.5, ownershipLimit: 5 },
      { id: "p_ind_14", name: "Arshdeep Singh", realTeam: "IND", position: "BOWL", price: 9.0, ownershipLimit: 5 },

      // Australia Squad
      { id: "p_aus_01", name: "Travis Head", realTeam: "AUS", position: "BAT", price: 11.5, ownershipLimit: 5 },
      { id: "p_aus_02", name: "David Warner", realTeam: "AUS", position: "BAT", price: 10.5, ownershipLimit: 5 },
      { id: "p_aus_03", name: "Steve Smith", realTeam: "AUS", position: "BAT", price: 11.0, ownershipLimit: 5 },
      { id: "p_aus_04", name: "Mitchell Marsh", realTeam: "AUS", position: "AR", price: 10.5, ownershipLimit: 5 },
      { id: "p_aus_05", name: "Glenn Maxwell", realTeam: "AUS", position: "AR", price: 11.0, ownershipLimit: 5 },
      { id: "p_aus_06", name: "Marcus Stoinis", realTeam: "AUS", position: "AR", price: 9.5, ownershipLimit: 5 },
      { id: "p_aus_07", name: "Josh Inglis", realTeam: "AUS", position: "WK", price: 9.0, ownershipLimit: 5 },
      { id: "p_aus_08", name: "Matthew Wade", realTeam: "AUS", position: "WK", price: 8.5, ownershipLimit: 5 },
      { id: "p_aus_09", name: "Pat Cummins", realTeam: "AUS", position: "BOWL", price: 11.5, ownershipLimit: 5 },
      { id: "p_aus_10", name: "Mitchell Starc", realTeam: "AUS", position: "BOWL", price: 11.0, ownershipLimit: 5 },
      { id: "p_aus_11", name: "Josh Hazlewood", realTeam: "AUS", position: "BOWL", price: 10.5, ownershipLimit: 5 },
      { id: "p_aus_12", name: "Adam Zampa", realTeam: "AUS", position: "BOWL", price: 10.0, ownershipLimit: 5 },
    ]
  },
  {
    id: "match_csk_mi_2026_02",
    name: "Chennai Super Kings vs Mumbai Indians",
    series: "Indian Premier League 2026",
    format: "T20",
    venue: "M. A. Chidambaram Stadium, Chennai",
    matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
    lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 30).toISOString(),
    status: "Upcoming",
    team1: {
      name: "Chennai Super Kings",
      shortName: "CSK",
      code: "CSK",
      logo: "🦁"
    },
    team2: {
      name: "Mumbai Indians",
      shortName: "MI",
      code: "MI",
      logo: "⚡"
    },
    squad: [
      // CSK
      { id: "p_csk_01", name: "Ruturaj Gaikwad", realTeam: "CSK", position: "BAT", price: 11.0, ownershipLimit: 5 },
      { id: "p_csk_02", name: "MS Dhoni", realTeam: "CSK", position: "WK", price: 10.5, ownershipLimit: 5 },
      { id: "p_csk_03", name: "Ravindra Jadeja", realTeam: "CSK", position: "AR", price: 11.0, ownershipLimit: 5 },
      { id: "p_csk_04", name: "Shivam Dube", realTeam: "CSK", position: "AR", price: 10.0, ownershipLimit: 5 },
      { id: "p_csk_05", name: "Matheesha Pathirana", realTeam: "CSK", position: "BOWL", price: 10.5, ownershipLimit: 5 },
      { id: "p_csk_06", name: "Deepak Chahar", realTeam: "CSK", position: "BOWL", price: 9.0, ownershipLimit: 5 },
      { id: "p_csk_07", name: "Devon Conway", realTeam: "CSK", position: "BAT", price: 10.0, ownershipLimit: 5 },
      { id: "p_csk_08", name: "Moeen Ali", realTeam: "CSK", position: "AR", price: 9.5, ownershipLimit: 5 },
      { id: "p_csk_09", name: "Tushar Deshpande", realTeam: "CSK", position: "BOWL", price: 8.5, ownershipLimit: 5 },
      { id: "p_csk_10", name: "Ajinkya Rahane", realTeam: "CSK", position: "BAT", price: 8.5, ownershipLimit: 5 },
      { id: "p_csk_11", name: "Maheesh Theekshana", realTeam: "CSK", position: "BOWL", price: 9.0, ownershipLimit: 5 },
      { id: "p_csk_12", name: "Mustafizur Rahman", realTeam: "CSK", position: "BOWL", price: 9.0, ownershipLimit: 5 },

      // MI
      { id: "p_mi_01", name: "Rohit Sharma", realTeam: "MI", position: "BAT", price: 11.5, ownershipLimit: 5 },
      { id: "p_mi_02", name: "Suryakumar Yadav", realTeam: "MI", position: "BAT", price: 11.5, ownershipLimit: 5 },
      { id: "p_mi_03", name: "Hardik Pandya", realTeam: "MI", position: "AR", price: 11.0, ownershipLimit: 5 },
      { id: "p_mi_04", name: "Jasprit Bumrah", realTeam: "MI", position: "BOWL", price: 12.0, ownershipLimit: 5 },
      { id: "p_mi_05", name: "Ishan Kishan", realTeam: "MI", position: "WK", price: 10.0, ownershipLimit: 5 },
      { id: "p_mi_06", name: "Tilak Varma", realTeam: "MI", position: "BAT", price: 9.5, ownershipLimit: 5 },
      { id: "p_mi_07", name: "Tim David", realTeam: "MI", position: "BAT", price: 9.0, ownershipLimit: 5 },
      { id: "p_mi_08", name: "Gerald Coetzee", realTeam: "MI", position: "BOWL", price: 9.0, ownershipLimit: 5 },
      { id: "p_mi_09", name: "Piyush Chawla", realTeam: "MI", position: "BOWL", price: 8.5, ownershipLimit: 5 },
      { id: "p_mi_10", name: "Romario Shepherd", realTeam: "MI", position: "AR", price: 9.0, ownershipLimit: 5 },
      { id: "p_mi_11", name: "Nuwan Thushara", realTeam: "MI", position: "BOWL", price: 8.5, ownershipLimit: 5 },
      { id: "p_mi_12", name: "Mohammad Nabi", realTeam: "MI", position: "AR", price: 8.5, ownershipLimit: 5 },
    ]
  },
  {
    id: "match_eng_sa_2026_03",
    name: "England vs South Africa",
    series: "ICC Champions Trophy 2026",
    format: "ODI",
    venue: "Lord's Cricket Ground, London",
    matchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days from now
    lineupLockTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4 - 1000 * 60 * 30).toISOString(),
    status: "Upcoming",
    team1: {
      name: "England",
      shortName: "ENG",
      code: "ENG",
      logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
    },
    team2: {
      name: "South Africa",
      shortName: "SA",
      code: "SA",
      logo: "🇿🇦"
    },
    squad: [
      // England
      { id: "p_eng_01", name: "Jos Buttler", realTeam: "ENG", position: "WK", price: 11.5, ownershipLimit: 5 },
      { id: "p_eng_02", name: "Phil Salt", realTeam: "ENG", position: "BAT", price: 10.5, ownershipLimit: 5 },
      { id: "p_eng_03", name: "Harry Brook", realTeam: "ENG", position: "BAT", price: 10.5, ownershipLimit: 5 },
      { id: "p_eng_04", name: "Liam Livingstone", realTeam: "ENG", position: "AR", price: 10.0, ownershipLimit: 5 },
      { id: "p_eng_05", name: "Sam Curran", realTeam: "ENG", position: "AR", price: 10.0, ownershipLimit: 5 },
      { id: "p_eng_06", name: "Jofra Archer", realTeam: "ENG", position: "BOWL", price: 11.0, ownershipLimit: 5 },
      { id: "p_eng_07", name: "Adil Rashid", realTeam: "ENG", position: "BOWL", price: 10.0, ownershipLimit: 5 },
      { id: "p_eng_08", name: "Mark Wood", realTeam: "ENG", position: "BOWL", price: 9.5, ownershipLimit: 5 },
      { id: "p_eng_09", name: "Will Jacks", realTeam: "ENG", position: "AR", price: 9.5, ownershipLimit: 5 },
      { id: "p_eng_10", name: "Reece Topley", realTeam: "ENG", position: "BOWL", price: 9.0, ownershipLimit: 5 },
      { id: "p_eng_11", name: "Jonny Bairstow", realTeam: "ENG", position: "WK", price: 9.5, ownershipLimit: 5 },

      // South Africa
      { id: "p_sa_01", name: "Heinrich Klaasen", realTeam: "SA", position: "WK", price: 11.5, ownershipLimit: 5 },
      { id: "p_sa_02", name: "Quinton de Kock", realTeam: "SA", position: "WK", price: 11.0, ownershipLimit: 5 },
      { id: "p_sa_03", name: "Aiden Markram", realTeam: "SA", position: "BAT", price: 10.5, ownershipLimit: 5 },
      { id: "p_sa_04", name: "David Miller", realTeam: "SA", position: "BAT", price: 10.0, ownershipLimit: 5 },
      { id: "p_sa_05", name: "Tristan Stubbs", realTeam: "SA", position: "BAT", price: 9.5, ownershipLimit: 5 },
      { id: "p_sa_06", name: "Marco Jansen", realTeam: "SA", position: "AR", price: 10.5, ownershipLimit: 5 },
      { id: "p_sa_07", name: "Kagiso Rabada", realTeam: "SA", position: "BOWL", price: 11.0, ownershipLimit: 5 },
      { id: "p_sa_08", name: "Anrich Nortje", realTeam: "SA", position: "BOWL", price: 10.5, ownershipLimit: 5 },
      { id: "p_sa_09", name: "Keshav Maharaj", realTeam: "SA", position: "BOWL", price: 9.5, ownershipLimit: 5 },
      { id: "p_sa_10", name: "Tabraiz Shamsi", realTeam: "SA", position: "BOWL", price: 9.0, ownershipLimit: 5 },
      { id: "p_sa_11", name: "Lungi Ngidi", realTeam: "SA", position: "BOWL", price: 9.0, ownershipLimit: 5 },
    ]
  }
];
