# WiNS Specification

This is the baseline specification for CTP (Cyle Transfer Protocol) requests and responses. CTP is based heavily on HTTP, but made specifically incompatible.

## Requests

A typical WiNS request is simply a domain name string, such as `domain.lol`.

## Responses

A typical WiNS response is a one-liner containing at least a response code string and hopefully the information requested (if available).

### Response Status Code Strings

Here are the standard response code strings:

- `here` followed by an IP address is the typical response when the requested domain name is found and has an IP associated with it.
- `nope` is the typical response when the requested domain name is not found for whatever reason.
- `try` followed by an IP address means that this server does not have the answer, but another WiNS server probably does.

## WiNS Record Format

Internally, a WiNS server holds onto records in the following formats.

When a domain name has an associated IP address:

    domain.lol is 192.168.1.20

When a domain name's record is probably on another server:

    domain.lol lives 192.168.1.5