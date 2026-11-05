package com.fastfood.management.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "momo")
public class MomoProperties {
    private String partnerCode = "";
    private String accessKey = "";
    private String secretKey = "";
    private String endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    private String redirectUrl = "http://localhost:8080/payment/momo/return";
    private String ipnUrl = "http://localhost:8080/payment/momo/ipn";
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String value) { partnerCode = value; }
    public String getAccessKey() { return accessKey; }
    public void setAccessKey(String value) { accessKey = value; }
    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String value) { secretKey = value; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String value) { endpoint = value; }
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String value) { redirectUrl = value; }
    public String getIpnUrl() { return ipnUrl; }
    public void setIpnUrl(String value) { ipnUrl = value; }
    public boolean isConfigured() { return !partnerCode.isBlank() && !accessKey.isBlank() && !secretKey.isBlank(); }
}
