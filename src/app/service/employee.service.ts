import { Injectable } from '@angular/core';
import {BehaviorSubject, map, Observable} from "rxjs";
import {Employee} from "../model/employee";
import {Apollo} from "apollo-angular";
import {gql} from "@apollo/client/core";

const GET_EMPLOYEES = gql`
query {
  employees {
    id
    name
    dateOfBirth
    city
    salary
    gender
    email
  }
}
`;

const ADD_EMPLOYEE = gql`
mutation addEmployee($name: String!,
  $dateOfBirth: String!,
  $city: String!,
  $salary: Float!,
  $gender: String!,
  $email: String!) {
  newEmployee(createEmployeeInput: {name: $name, dateOfBirth: $dateOfBirth, city: $city, salary: $salary, gender: $gender, email: $email}) {
    id
    name
    dateOfBirth
    city
    salary
    gender
    email
  }
}
`;

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  employees$: BehaviorSubject<readonly Employee[]> = new BehaviorSubject<readonly Employee[]>([]);

  // constructor(private apollo: Apollo) {
  //   this.apollo.watchQuery<any>({query: GET_EMPLOYEES}).valueChanges.pipe(
  //     map(({data, loading}) => {
  //       console.log("inside the service,",data.employees);
  //       this.employees$.next(data.employees);
  //     })
  //   ).subscribe();
  // }

  constructor(private apollo: Apollo) {
    this.apollo.watchQuery<any>({ query: GET_EMPLOYEES,   fetchPolicy: "no-cache", // no cache to avoid duplicates
    }).valueChanges.pipe(
      map(({ data, loading }) => {
        // for the date to be displayed, it should be reconstructed here
        const updatedEmployees = data.employees.map((employee: any) => {
          const [day, month, year] = employee.dateOfBirth.split("-");
          return {
            ...employee,
            dateOfBirth: `${year}-${month}-${day}`
          };
        });
  
        console.log("Updated employees:", updatedEmployees);
        this.employees$.next(updatedEmployees);
      })
    ).subscribe();
  }
  
  get $(): Observable<readonly Employee[]> {
    return this.employees$.asObservable();
  }

  addEmployee(employee: Employee) {
    return this.apollo.mutate<any>({mutation: ADD_EMPLOYEE, variables: {
      name: employee.name,
      dateOfBirth: employee.dateOfBirth,
      city: employee.city,
      salary: employee.salary,
      gender: employee.gender,
      email: employee.email
    }}).pipe(
          map(({data, loading}) => {
            this.employees$.next([...this.employees$.getValue(), data.newEmployee]);
          })
    )
  }
}
