package com.fastfood.management.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "zalopay")
public class ZaloPayProperties {
    private int appId;
    private String key1 = "";
    private String key2 = "";
    private String endpoint = "https://sb-openapi.zalopay.vn/v2/create";
    private String redirectUrl = "http://localhost:8080/payment/zalopay/return";
    private String callbackUrl = "http://localhost:8080/payment/zalopay/callback";
    public int getAppId() { return appId; }
    public void setAppId(int value) { appId = value; }
    public String getKey1() { return key1; }
    public void setKey1(String value) { key1 = value; }
    public String getKey2() { return key2; }
    public void setKey2(String value) { key2 = value; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String value) { endpoint = value; }
    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String value) { redirectUrl = value; }
    public String getCallbackUrl() { return callbackUrl; }
    public void setCallbackUrl(String value) { callbackUrl = value; }
    public boolean isConfigured() { return appId > 0 && !key1.isBlank() && !key2.isBlank(); }
}
