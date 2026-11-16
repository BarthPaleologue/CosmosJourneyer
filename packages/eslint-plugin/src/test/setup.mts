import * as nodeTest from "node:test";

import { RuleTester } from "@typescript-eslint/rule-tester";

RuleTester.afterAll = nodeTest.after;
RuleTester.describe = nodeTest.describe;
RuleTester.it = nodeTest.it;
RuleTester.itOnly = nodeTest.only;
