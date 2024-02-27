public class CustomerProduct {
    @AuraEnabled
    public static List<Customer__c> createCustomer(String name, String phone, String email, String address) {
            
        try {
            List<Customer__c> custList = new List<Customer__c>();
            Customer__c newCustomer = new Customer__c();
            newCustomer.Name = name;
            newCustomer.Phone__c = phone;
            newCustomer.Email__c = email;
            newCustomer.Address__c = address;
            custList.add(newCustomer);
            if (custList != null) {
               insert custList;  
            }
            return custList;
        } catch (Exception e) {
              String errorMsg = e.getMessage();
            throw new AuraHandledException(errorMsg);
            
        }
    }

     @AuraEnabled(cacheable=true)
    public static List<Product__c> searchProducts(String prodName) {
    
        try {
         String searchItem = '%' + prodName + '%';
         String query = 'SELECT Id, Name, Quantity__c, Base_Price__c, List_Price__c, Net_Price__c ' +
                       'FROM Product__c ' +
                       'WHERE Name LIKE :searchItem ' +
                       'LIMIT 100';
        return Database.query(query);
        
    } catch (Exception e) {
        
         throw new AuraHandledException(e.getMessage());
    }
       
      
		//return [SELECT Id, Name, Quantity__c, Base_Price__c, List_Price__c, Net_Price__c FROM Product__c where Name =:prodName limit 10 ];
		
    }
    }