'use strict';

import Util from './_lib/lib';
import {thirdPartyString} from './_vendor/thirdParty1';
import * as thirdParty2 from './_vendor/thirdParty2';
import template from './_lib/template.html!text';


function hello() {
  var util = new Util();
  console.log(util.name());

  console.log(thirdPartyString);
  console.log(thirdParty2.anotherThirdPartyString);
  console.log(template);
}

hello();
