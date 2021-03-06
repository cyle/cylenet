# CTP Specification

This is the baseline specification for CTP (Cyle Transfer Protocol) requests and responses.

CTP is based heavily on HTTP, but made _specifically incompatible_.

## Requests

A basic CTP request from a client is contained on one line and looks like this:

    ctp/1.0 req domain.lol

That translates to a CTP version 1.0 request to `domain.lol` for the resource at path `/` (which is the default value when no path is specified after the domain address). Here's an example for a non-`/` resource:

    ctp/1.0 req domain.lol/something

Where `/something` is a resource being served by the CTP server at `domain.lol`.

More advanced requests contain more than one line in the request. For example, you can include request headers directly underneath the request string:

    ctp/1.0 req domain.lol/what
    header-name value

You can also include data, separated from the headers by an empty newline, when using certain request methods:

    ctp/1.0 takethis domain.lol/handler
    data-type json

    {"wut":"huh?"}

In that example, the client is sending a JSON object to `domain.lol/handler` via a `takethis` request.

### Request Method/Verb Strings

Here are the possible standard methods/verbs that can be used in a request, following the regex `/^[a-z]{2,32}$/i`:

- `req` is asking the server for the content at the specified resource path.
- `hey` is asking whether the specified resource path exists, but not for the content itself.
- `takethis` is for sending data from the cleitn to a resource on the server; the request line is then followed by the content to be received by the server.

### Request Header Format

Request headers follow these rules:

- All header keys are case insensitive, following this regex: `/^[-_0-9a-z]{2,255}$/i` (note the lack of spaces).
- There must be one space between the header key and the header value.
- Header values are _case sensitive_ and can be between 1 and 256 characters long.
- The only illegal character for a header value is a newline.
- Headers must be no longer than 512 characters (255 for header name, space, then 256 for header value).
- Headers should be separated by a unix newline character (\n).
- There can be as many headers as you wish, but only the first instance of a header key will be used.

### Common Request Headers

Some common request headers include:

- `data-type` informs the server how to interpret the data included in the request.
- `client-type` informs the server what kind of client is making the request.

## Responses

When performing a `req` request for a resource that exists, a CTP client should expect a response from the CTP server in the following format:

    ctp/1.0 okay
    header-name Value

    Actual Response Content Area Here

All responses will begin with the version of CTP used, followed by a space, and then a status code string. After a unix newline character (\n), any headers will be on their own lines (separated by unix newline characters), then a blank newline, and then the actual content of the resource. By standard, content is expected to be in Markdown format.

### Response Header Format

Response header formatting follows the same rules as [request headers](#request-header-format).

### Common Response Headers

Some common response headers include:

- `data-type` informs the client how to interpret the data included in the request. By default, clients should assume "markdown" if this header is omitted.
- `server-type` informs the client what kind of server is interpreting the request and generating the response.
- `accepted-types` informs the client what kind of data is accepted by this handler in a comma-separated list. Useful in response to a `hey` request.

### Response Status Code Strings

Here are the possible standard response status code strings, following the regex `/^[a-z]{2,32}$/i`:

- `okay` means the resource was found and is contained within the response content area.
- `sure` means the resource does exist, but does not contain any of the content. Useful in response to a `hey` request.
- `nope` means the resource was not returned for some reason; the reason may be contained in the response content area.
- `moved` means the resource was moved somewhere else; the new resource path will be contained in the response content area.
