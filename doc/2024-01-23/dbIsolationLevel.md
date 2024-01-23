# Transaction isolation Level

**Status**: proposed.<!-- proposed, rejected, accepted, deprecated, superseded by ADR-0005 <0005-example.md> -->
**Date**: 2024/01/22
**Deciders**: Jordi Dalmau, Alvaro Candelario <!-- list everyone involved in the decision -->
**Consulted**: Jordi Dalmau <!-- list everyone whose opinions are sought (typically subject-matter experts); and with whom there is a two-way communication -->
**Informed**: Jordi Dalmau<!-- list everyone who is kept up-to-date on progress; and with whom there is a one-way communication -->


## Context and Problem Statement

<!--Describe the context and problem statement, e.g., in free form using two to three sentences or in the form of an illustrative story.
 You may want to articulate the problem in form of a question and add links to collaboration boards or issue management systems.-->

Transaction isolation is a key aspect of database management, defining how transactions interact in scenarios with concurrent changes. The isolation level setting ensures a delicate balance between performance optimization and maintaining the reliability and consistency of data operations.

Related issues: 
 * Mysql Reference Manual: [https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html]
 * Integrity violations: [https://jennyttt.medium.com/dirty-read-non-repeatable-read-and-phantom-read-bd75dd69d03a]

## Decision Drivers

* Data consistency priority: emphasize the importance of maintaining a high level of consistency and reliability in data operations.

* Concurrency control requirements: underscore the necessity for effective concurrency control, ensuring that multiple transactions can execute concurrently without compromising data consistency.

* Row locking mechanisms: focus on the selection of row-level locking mechanisms as a key consideration.

## Considered Options

* REPEATABLE READ
* READ COMMITTED

## Decision Outcome

Chosen option: "REPEATABLE READ", the selection of this isolation level is driven by a main focus on data consistency, effective concurrency control, and the use of row-level locking mechanisms. This choice prevents dirty reads, non-repeatable reads and phantom reads.
<!-- justification. e.g., only option, which meets k.o. criterion decision driver, which resolves force {force}, … , comes out best (see below). -->

<!-- This is an optional element. Feel free to remove. -->
## Validation

describe how the implementation of/compliance with the ADR is validated. E.g., by a review or an ArchUnit test

<!-- This is an optional element. Feel free to remove. -->
## Pros and Cons of the Options

### REPEATABLE READ

* Good, because can guarantee the consistent reads within the same transaction, reading the snapshot established by the first read.
* Good, because for a unique index with a unique search condition, locking reads, update and delete statements locks only the index record.
* Good, because for other search conditions, it uses gap locks, minimizing the appearance of phantom rows.
* Bad, because locks can decrease the performance of the transactions.
* Bad, because increases the probability of deadlocks. 

### READ COMMITTED

* Good, because allows for improved concurrency by releasing locks immediately after the read operation, reducing contention.
* Good, because decrease the probability of deadlocks and improving overall transaction performance.
* Bad, because might result in non-repeatable reads, as changes made by other transactions during the same transaction are visible.
* Bad, because gap locking is disabled and might lead to phantom reads.

<!-- This is an optional element. Feel free to remove. -->
## Links

* More about transaction isolation levels: [https://www.geeksforgeeks.org/transaction-isolation-levels-dbms/]