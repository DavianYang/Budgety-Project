// BUDGET CONTROLLER  ────────────────────────────────────────────────────────────────────────────────
var budgetController = (function(){

    let Expense = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    let Income = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
    };

    Expense.prototype.calcPercentage = function(totalIncome){
        if(totalIncome > 0){
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function(){
        return this.percentage;
    };

    let calculateTotal = function(type){
        let sum = 0;

        data.allItems[type].forEach((cur) => {
            sum += cur.value;
        });

        data.totals[type] = sum;
    };

    let data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1 // -1 is usually that something is nonexistent
    }

    return {
        addItem: function(type, des, val){
            let newItem, ID;

            // [1, 2, 3, 4, 5], next ID = 6;
            // [1. 2, 6, 8], next ID = 9;
            // ID = lastID (array's length - 1) + 1;
            
            // Create new ID
            if(data.allItems[type].length > 0 ){
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            if(type === "exp"){
                newItem = new Expense(ID, des, val);
            } else if (type === "inc"){
                newItem = new Income(ID, des, val);
            }

            // Push Item into data structer
            data.allItems[type].push(newItem);

            // Return the new element
            return newItem;
        },
        deleteItem: function(type, id){
            let index, ids;

            // map is like forEach loop, the difference is map return new array 
            ids = data.allItems[type].map(function(current){
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1){
                data.allItems[type].splice(index, 1);
            }
            
        },
        calculateBudget: function(){
            
            // Calculate total income and expense
            calculateTotal('inc');
            calculateTotal('exp');


            // Calculate the budget: income - expense
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent
            if(data.totals.inc > 0){
                data.percentage = Math.round((data.totals.exp / data.totals.inc)*100);
            } else {
                data.percentage = -1; 
            }
            
        },
        calculatePercentages: function(){

            data.allItems.exp.forEach((cur) => {
                cur.calcPercentage(data.totals.inc);
            })

        },
        getPercentages: function(){
            let allPerc = data.allItems.exp.map((cur) => {
                return cur.getPercentage();
            });

            return allPerc;
        },
        getBudget: function(){
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
        testing: function(){
            console.log(data);
        }
    }

})();

// UI CONTROLLER ────────────────────────────────────────────────────────────────────────────────
var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription : '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensePercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    }

    let formatNum = function(num, type){

       let numSplit, int, dec, sign;
        /*
        + or - before number
        exactly 2 decimal points
        comma separating the thousands

        2310.4567 -> 2,310.46
        2000 -> 2,000.00
        */
        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');
 
        int = numSplit[0];

        if(int.length > 3){
            // In substr(index, how many characters we want)
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length); 
        }

        dec = numSplit[1];

        // type === 'exp' ? sign = '-' : sign = '+';

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    }


    let nodeListforEach = function(list, callback){
        for(let i = 0; i < list.length; i++){
            callback(list[i], i);
        }
    }

    return {
        getInput: function(){
            return {
                type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        addListItem: function(obj, type){

            let html, element, newHtml;
            
            // Create HTML string with placeholder text

            if(type === 'inc'){

            element = DOMstrings.incomeContainer;

           html =  `<div class="item clearfix" id="inc-%id%">
           <div class="item__description">%description%</div>
           <div class="right clearfix">
               <div class="item__value">%value%</div>
               <div class="item__delete">
                   <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
               </div>
                </div>
            </div>`

            } else if(type === 'exp'){

                element = DOMstrings.expensesContainer;

                html = `<div class="item clearfix" id="exp-%id%">
                <div class="item__description">%description%</div>
                <div class="right clearfix">
                    <div class="item__value">%value%</div>
                    <div class="item__percentage">21%</div>
                    <div class="item__delete">
                        <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                    </div>
                </div>
            </div>`

            }
            // Replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNum(obj.value, type));

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorID){

            let el= document.getElementById(selectorID)

            el.parentNode.removeChild(el);
        },
        clearFields: function() {
            let fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array){
                current.value = '';
            });

            fieldsArr[0].focus();
        },

        displayBudget: function(obj){
            var type;
            obj.budget >= 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNum(obj.budget, type) ;
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNum(obj.totalInc, 'inc') ;
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNum(obj.totalExp, 'exp') ;
            
            if(obj.percentage >=  0){
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },
        displayPercentages: function(percentages){

            let fields = document.querySelectorAll(DOMstrings.expensePercLabel);

            nodeListforEach(fields, function(current, index){

                if(percentages[index] > 0){
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            })

        },
        diplayMonth: function(){
            let now, months, month, year;

            now = new Date();

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            month = now.getMonth();

            year = now.getFullYear();

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' +year;
        },
        changedType: function(){
            let fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );

            nodeListforEach(fields, (cur) => {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },
        getDOMstrings: function() {
            return DOMstrings;
        }
    }

})();

// GLOBAL APP CONTROLLER ────────────────────────────────────────────────────────────────────────────────
var controller = (function(budgetCtrl, UICtrl){

    let setupEventListener = function(){

        let DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAdditem);

        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13){
                ctrlAdditem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

    }

    let ctrlAdditem = function(){
        let input, newItem;

        // 1. Get the field input data
        input = UICtrl.getInput();

        if(input.description !== "" && !isNaN(input.value) && input.value > 0){
            // 2. Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear Fields
            UICtrl.clearFields();

            // 5. Calculate and update budget
            updateBudget();

            // 6. Calculate and update the percentages
            updatePercentage();

        }

    }

    let updateBudget = function(){

        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the badget
        const budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);

    }

    let updatePercentage = function(){

        // 1. Calculate Percentage
        budgetCtrl.calculatePercentages();

        // 2. Read Percentage from the budge conroller
        let percentages = budgetCtrl.getPercentages();

        // 3. Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);

    }

    let ctrDeleteItem = function(e){
        let itemID, splitID, type, ID;

        itemID = e.target.parentNode.parentNode.parentNode.parentNode.id;

        if(itemID){
            splitID = itemID.split('-');

            type = splitID[0];

            ID = parseInt(splitID[1]);
            
            // 1. Delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);

            // 2. Delete the item from UI
            UICtrl.deleteListItem(itemID);

            // 3. Update and show the budget
            updateBudget();

            // 4. Calculate and update the percentages
            updatePercentage();
        }

        e.preventDefault();
    };

    return {
        init: function(){
            console.log('App Initializing....');
            // 3. Display the budget on the UI
            UICtrl.diplayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListener();
        }
    }
})(budgetController, UIController);

controller.init();
