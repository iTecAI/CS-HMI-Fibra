# Fibra

## Premise
**Fibra** is a satirical and informative web-based simulation meant to emulate the simple functions of Libra, a centralized cryptocurrency created by the Libra Association of Facebook. "Fibra" is derived from "Fib" and "Libra" (Libra White Paper). The **Fibra** system implements multi-user collaboration to simulate this system, using a number of randomly-acting bots to fill in the gaps.

This project aims to illustrate the privacy issues that are inherent to a centralized cryptocurrency system like Libra.

## Simulation Elements
- **Users**
  Users are tracked by browser cookies that maintain their sessions between browser and page reloads. Both the Bots and Users utilize the same class structure, meaning that they can interact between eachother easily.
- **Bots**
  Bots are controlled by an asynchronous routine that runs every five seconds, causing each bot to randomly add items to the Marketplace or purchase items from Users.
- **Marketplace**
  Items can be bought and sold in the Marketplace, which shows their cost and relevant information.
- **Wallet**
  The Wallet allows you to view your current Fibra and Dollars, and convert between them in the Fund Converter.
- **News**
  This panel shows news updates, which may include other people's purchases and information on the Fibra Association.

## Libra & the Libra Association

**Libra** is a centralized cryptocurrency system designed by Facebook and several other companies, which was first conceptualized in June of 2019. Facebook's presence in the company has since been somewhat decreased, but they're still at the forefront of much of the development (Facebook's Calibra Rebrands to Novi).

## The Issue With Centralization

Most cryptocurrencies (BTC, ETH, etc) are **decentralized**, meaning that their processing and proof-of-work algorithms are spread across a network of independent systems. This both prevents any one entity from controlling or disrupting the network, and allows a nearly excessive amount of redundancy for financial data. In most systems, this decentralized model also allows a great amount of privacy, as users are only identified by their in-system addresses and not names or usernames.

Libra and several other government-planned cryptocurrencies, however, are **centralized**. Much like conventional currencies, centralized cryptocurrencies are controlled by a single authority - the Libra Association, in this case. Though this can technically add stability to the currency, it also places the entire control of the system and those who use it under the purview of an entity that may or may not have its users' best interests in mind. Furthermore, a centralized system means a loss in redundancy, as any company failure or significant disastrous event could cause a total erasure of the system's financial data (A National Digital Currency Has Serious Privacy Implications).