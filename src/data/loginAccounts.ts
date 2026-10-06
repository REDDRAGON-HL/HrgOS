import type { UserMode } from "../types";

export interface LoginAccount {
  readonly role: UserMode;
  readonly username: string;
  readonly teamId?: string;
  readonly salt: string;
  readonly passwordHash: string;
}

// Frontend prototype allowlist; plaintext passwords are kept outside the served assets.
export const loginAccounts: readonly LoginAccount[] = [
  {
    "role": "staff",
    "username": "hrg-staff-01",
    "salt": "858403dcf414f741e5b3072b87966a26",
    "passwordHash": "4fe3d308caf79d4002048af184eaebe13db26dd22ad7ac0e1de5c739fe903ba5"
  },
  {
    "role": "staff",
    "username": "hrg-staff-02",
    "salt": "221e1842e9df4fa266dbcf88ee180947",
    "passwordHash": "ea2fb4ca71476fed57300a12b7d369d05e409f1d3172837d73334bddee8a6a03"
  },
  {
    "role": "staff",
    "username": "hrg-staff-03",
    "salt": "b0a0ff6dad8615dd113a0eb5e8d6119c",
    "passwordHash": "ab9c013ad9d70894f58205513ae22b271f0e116c49b8fa19d409ec7f8efc3e72"
  },
  {
    "role": "staff",
    "username": "hrg-staff-04",
    "salt": "69b69128427cbbb130f6134115067725",
    "passwordHash": "8407e45d2b8685d3dbd87ebdf05dd0d1747b274de700492d89c1aee5372fba87"
  },
  {
    "role": "player",
    "username": "hrg-player-01",
    "teamId": "team-1",
    "salt": "dc748107adadd7fd21b9426486e81955",
    "passwordHash": "80de7db968a3d5aac7e8988cb9f153e5142b4be84e0ffff00c052672a905dc5d"
  },
  {
    "role": "player",
    "username": "hrg-player-02",
    "teamId": "team-1",
    "salt": "a14b693b0fd6d502c130dc6a389edf25",
    "passwordHash": "b6196981825e05900fe730a3e211548e851c383ba8611458cf776a3a3865dd37"
  },
  {
    "role": "player",
    "username": "hrg-player-03",
    "teamId": "team-1",
    "salt": "c788a276889181180da84057939ec614",
    "passwordHash": "b5ce5400d9dd0dea0f4ebfc9ff8d887fa96534f184485351c9f67c34cdf28231"
  },
  {
    "role": "player",
    "username": "hrg-player-04",
    "teamId": "team-1",
    "salt": "194470dcb5ea39cb25a73c7d4afce996",
    "passwordHash": "f8b8ff908842dbe2dc64a657af6217d4ea2aa3836c34a86b422ee9d0e549583f"
  },
  {
    "role": "player",
    "username": "hrg-player-05",
    "teamId": "team-2",
    "salt": "f1e0f940182f56cfc0851e36619f75a4",
    "passwordHash": "c26f2a98ee517ff817914627e8e79d2d05c6ec57c321db03daa5fea2d77aacaf"
  },
  {
    "role": "player",
    "username": "hrg-player-06",
    "teamId": "team-2",
    "salt": "45d889ac70aceca5e4273550481695f7",
    "passwordHash": "cb7c0f07ef2c16386124f2f45b9aada6489c02612493f8a6cdc3b1c5291b678e"
  },
  {
    "role": "player",
    "username": "hrg-player-07",
    "teamId": "team-2",
    "salt": "bf8d876705e107620f44cef100ea17cf",
    "passwordHash": "19e450e1a559dde0db155fc32fe0741d0c8aed3d299dadd44d3f4b2b2a0b9c26"
  },
  {
    "role": "player",
    "username": "hrg-player-08",
    "teamId": "team-2",
    "salt": "bb6f9a42609f0e9875e2cfb90335887e",
    "passwordHash": "18a17ca0766805aaa5e65053f42235818f8c70b0f7f97828f692d6c0568f86b9"
  },
  {
    "role": "player",
    "username": "hrg-player-09",
    "teamId": "team-3",
    "salt": "58276929c5c95cd380363742ef468b97",
    "passwordHash": "b4c74f525374e3e3ed8b9d84a206732cc7996a45a020b5cc21786b1663538b21"
  },
  {
    "role": "player",
    "username": "hrg-player-10",
    "teamId": "team-3",
    "salt": "3918149621a3180797dc667a665c08e7",
    "passwordHash": "43c598796db33511d266f667ffd84ac6b740265c8514792fb2fcbba4b8032971"
  },
  {
    "role": "player",
    "username": "hrg-player-11",
    "teamId": "team-3",
    "salt": "8d39876bc3eb67b7f93513941b655038",
    "passwordHash": "b4fa2ab6111f421293a587bba3b707e1c98335b22844d243b973b1643245c262"
  },
  {
    "role": "player",
    "username": "hrg-player-12",
    "teamId": "team-3",
    "salt": "02fea97093b74e887d35f5abba486453",
    "passwordHash": "9234b9111d6edcc7becc0a3475a6ecf828f6ce0ef90c5b3ec7fff4645f68144a"
  },
  {
    "role": "player",
    "username": "hrg-player-13",
    "teamId": "team-4",
    "salt": "e06182ef44785f9f90fdcffabb6397f0",
    "passwordHash": "7cff6719fc1517fa9bb162fb8ac401eee3789f7d38ff3392dd215744dd508c28"
  },
  {
    "role": "player",
    "username": "hrg-player-14",
    "teamId": "team-4",
    "salt": "6116479f526e37db4b3c9ca792e648b4",
    "passwordHash": "02dbd9d9884c19955762d6e2ef9b9be37df9cd612ecda1ddb27e9b77719471b2"
  },
  {
    "role": "player",
    "username": "hrg-player-15",
    "teamId": "team-4",
    "salt": "caa912bdf9a9eaee630bde30d83aab60",
    "passwordHash": "3aa5824c7931e42afd36fae34527067f19e39a80b146adf561b6ee621c2df4c7"
  },
  {
    "role": "player",
    "username": "hrg-player-16",
    "teamId": "team-4",
    "salt": "9418929017b137fa2046d03ab0c9f0d0",
    "passwordHash": "851a18788aa6690a93e7f5e9c33d94bc951981609fb6f06d0cf8d676394e1efb"
  },
  {
    "role": "player",
    "username": "hrg-player-17",
    "teamId": "team-5",
    "salt": "5bdd44b071a3f3ca3cd87bd49a0d42e2",
    "passwordHash": "27e532dac965fc9797bf054d255701e3684ae2ecb5998733dd9f6809af4553d0"
  },
  {
    "role": "player",
    "username": "hrg-player-18",
    "teamId": "team-5",
    "salt": "2e4081c80ff2a8e34df14173ade46e5c",
    "passwordHash": "6a6dcd08a6c62debe2f0b6998c2bfac76863f3bf10b4c483b8da4ca1ba514ab9"
  },
  {
    "role": "player",
    "username": "hrg-player-19",
    "teamId": "team-5",
    "salt": "c8311f7a6138abccadb114aba0039124",
    "passwordHash": "c5e9dfff090c2e3c3adb249b1da275bc51251dd5159b1b9109a13e9699b2ba3e"
  },
  {
    "role": "player",
    "username": "hrg-player-20",
    "teamId": "team-5",
    "salt": "d56175c3c82f8e2b6bdf25ff6d32bc13",
    "passwordHash": "d1ff40ecc3a7b7b73a3479beefc7c227544c207494de84f2a67174678a9f395f"
  }
];
