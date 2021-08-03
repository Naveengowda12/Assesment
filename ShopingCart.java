import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class ShopingCart{

	public static void main(String[] args) {
		try {

		Map<Character, Double> ProductPriceListing = new HashMap<Character, Double>();

		Scanner sc = new Scanner(System.in);

		ProductPriceListing.put('A', 35.00);
		ProductPriceListing.put('B', 65.00);
		ProductPriceListing.put('C', 50.00);
		ProductPriceListing.put('D', 85.00);
				
		/*
		 * -------Run Time input please Enable This Block-----*
		  System.out.println("Enter Product Code Without Space :");
		String input=sc.next();  
		Terminal terminal=new Terminal(ProductPriceListing);
				for(int i=0;i<input.length();i++) {
			terminal.scan(input.charAt(i));
			}
		System.out.println("The Scanning Product are : "+input);
		System.out.println("Verify the total price is RS : "+String.format("%.2f", terminal.getTotal()));
		*/
		
		/*---------------- Input 1 Testing ------------------ */
		Terminal terminal1=new Terminal(ProductPriceListing);
		String input1="ABCADABAA";
		for(int i=0;i<input1.length();i++) {
			terminal1.scan(input1.charAt(i));
			}
		System.out.println("The Scanning Product are : "+input1);
		System.out.println("Verify the total price is RS : "+String.format("%.2f", terminal1.getTotal()));
		
		/*---------------- Input 2 Testing ------------------ */
		Terminal terminal2=new Terminal(ProductPriceListing);
		String input2="CCCACCCC";
				
		for(int i=0;i<input2.length();i++) {
			terminal2.scan(input2.charAt(i));
			}
		System.out.println("The Scanning Product are : "+input2);
		System.out.println("Verify the total price is RS : "+String.format("%.2f", terminal2.getTotal()));
		
		/*---------------- Input 3 Testing ------------------ */
		Terminal terminal3=new Terminal(ProductPriceListing);
		String input3="ABCD";
				
		for(int i=0;i<input3.length();i++) {
			terminal3.scan(input3.charAt(i));
			}
		System.out.println("The Scanning Product are : "+input3);
		System.out.println("Verify the total price is RS : "+String.format("%.2f", terminal3.getTotal()));


	}catch(Exception e) {
		System.out.println("There is an error plsese check your input");
	}
	}
}

class Terminal {
	private double total;
	private Map<Character, Integer> productCountMap;
	private Map<Character, Double> productPriceList;

	public Terminal() {
		super();
		total = 0;
		productCountMap = new HashMap<Character, Integer>();
	}

	public Terminal(Map<Character, Double> productPriceList) {
		super();
		this.productPriceList = new HashMap<Character, Double>(productPriceList);
		productCountMap = new HashMap<Character, Integer>();
	}

	public double getTotal() {
		return total;
	}

	public void setPricing(Map<Character, Double> productPriceList) {
		this.productPriceList = new HashMap<Character, Double>(productPriceList);
	}

	public void resetTotal() {
		this.total = 0;
	}

	public void scan(Character productCode) {
		if (productCode == null) {
			throw new IllegalArgumentException("Product code cannot null you fool");
		} else if (!Character.isAlphabetic(productCode)) {
			throw new IllegalArgumentException("ProductCode must be a alphabet");
		}
		productCode= Character.toUpperCase(productCode);
		if (!productPriceList.containsKey(productCode)) {
			throw new IllegalArgumentException("Please provide valid productCode");
		}

		if (productCountMap.containsKey(productCode)) {
			if (productCode == 'A' && productCountMap.get(productCode) == 3) {
				total += (100 - productPriceList.get(productCode) * 3);
				productCountMap.replace(productCode, 0);
			} else if(productCode == 'C' && productCountMap.get(productCode) == 5) { 
				total += (250 - productPriceList.get(productCode) * 5);
				productCountMap.replace(productCode, 0);
			} else {
				productCountMap.replace(productCode, productCountMap.get(productCode) + 1);
				total+=productPriceList.get(productCode);
			}

		} else {
			productCountMap.put(productCode, 1);
			total+=productPriceList.get(productCode);
		}
	}
}
