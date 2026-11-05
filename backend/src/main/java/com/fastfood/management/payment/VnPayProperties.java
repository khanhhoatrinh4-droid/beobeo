package com.fastfood.management.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "vnpay")
public class VnPayProperties {
    private String tmnCode = "";
    private String hashSecret = "";
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String returnUrl = "http://localhost:8080/payment/vnpay/return";
    private String version = "2.1.0";
    public String getTmnCode(){return tmnCode;} public void setTmnCode(String value){tmnCode=value;}
    public String getHashSecret(){return hashSecret;} public void setHashSecret(String value){hashSecret=value;}
    public String getPayUrl(){return payUrl;} public void setPayUrl(String value){payUrl=value;}
    public String getReturnUrl(){return returnUrl;} public void setReturnUrl(String value){returnUrl=value;}
    public String getVersion(){return version;} public void setVersion(String value){version=value;}
    public boolean isConfigured() { return !tmnCode.isBlank() && !hashSecret.isBlank(); }
}
