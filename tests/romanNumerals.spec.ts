//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { expect, test } from "vitest";

import { romanNumeral } from "@/utils/strings/romanNumerals";

test("romanNumeral", () => {
    expect(romanNumeral(1)).toBe("I");
    expect(romanNumeral(3)).toBe("III");
    expect(romanNumeral(4)).toBe("IV");
    expect(romanNumeral(5)).toBe("V");
    expect(romanNumeral(9)).toBe("IX");
    expect(romanNumeral(10)).toBe("X");
    expect(romanNumeral(11)).toBe("XI");
    expect(romanNumeral(40)).toBe("XL");
    expect(romanNumeral(50)).toBe("L");
    expect(romanNumeral(90)).toBe("XC");
    expect(romanNumeral(100)).toBe("C");
    expect(romanNumeral(400)).toBe("CD");
    expect(romanNumeral(500)).toBe("D");
    expect(romanNumeral(900)).toBe("CM");
    expect(romanNumeral(1000)).toBe("M");
    expect(romanNumeral(3999)).toBe("MMMCMXCIX");
});
