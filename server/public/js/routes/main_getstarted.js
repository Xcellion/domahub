var surveyJSON = {
 goNextPageAutomatic: true,
 pages: [
  {
   name: "owner_check",
   questions: [
    {
     type: "radiogroup",
     choices: [
      "Yes",
      "No"
     ],
     colCount: 3,
     isRequired: true,
     name: "owner_check_q",
     title: "Do you own a domain name?"
    }
   ]
  },
  {
   name: "owner_reveal",
   questions: [
    {
     type: "radiogroup",
     choices: [
      {
       value: "1",
       text: "1 domain"
      },
      {
       value: "25",
       text: "1 - 25 domains"
      },
      {
       value: "25+",
       text: "25+ domains"
      }
     ],
     name: "owner_reveal_q",
     title: "How many domains do you own?"
    }
   ],
   title: "Renter",
   visible: false
  },
  {
   name: "renter_check",
   questions: [
    {
     type: "radiogroup",
     choices: [
      "Yes",
      "No"
     ],
     colCount: 3,
     isRequired: true,
     name: "renter_check_q",
     title: "Do you need a domain name?"
    }
   ],
   title: "Owner"
  },
  {
   name: "renter_reveal",
   questions: [
    {
     type: "text",
     name: "renter_reveal_q",
     size: "1000",
     title: "Any specific domain name in mind?"
    }
   ],
   visible: false
  },
  {
   name: "account",
   questions: [
    {
     type: "multipletext",
     isRequired: true,
     items: [
      {
       name: "email",
       title: "Email address"
      },
      {
       name: "fullname",
       title: "Full name"
      },
      {
       name: "password",
       title: "Password"
      },
      {
       name: "verify_pw",
       title: "Verify password"
      }
     ],
     name: "account_q",
     title: "Let's get your account set up"
    }
   ],
   visible: false
  }
 ],
 requiredText: "",
 showPageTitles: false,
 showQuestionNumbers: "off",
 showTitle: false,
 storeOthersAsComment: false,
 triggers: [
  {
   type: "visible",
   operator: "equal",
   value: "Yes",
   name: "owner_check_q",
   pages: [
    "account",
    "owner_reveal"
   ]
  },
  {
   type: "visible",
   operator: "equal",
   value: "Yes",
   name: "renter_check_q",
   pages: [
    "account",
    "renter_reveal"
   ]
  }
 ]
};

var survey = new Survey.Survey(surveyJSON, "surveyContainer");
survey.render("surveyContainer")
