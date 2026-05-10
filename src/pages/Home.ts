import m from 'mithril';

// Mock workout data
const WorkoutStore = {
  list: () => [
    { id: 1, name: 'Chest Day', icon: 'barbell' },
    { id: 2, name: 'Arms and Shoulders', icon: 'dumbbell' },
    // Add more workouts as needed
  ]
};

class HomePage {
  view() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Lift-Mate</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Home</IonTitle>
            </IonToolbar>
          </IonHeader>
          <WorkoutList workouts={WorkoutStore.list()} />
          <AddWorkoutButton navigateToNewWorkout={() => m.route.set('/workout/ne
w')} />
        </IonContent>
      </IonPage>
    );
  }
}

const WorkoutList = {
  view: ({ attrs }) => (
    <IonList>
      {attrs.workouts.map(workout => (
        <IonItem button key={workout.id} onClick={() => console.log(`Workout ${w
orkout.name} selected`)}>
          <IonIcon icon={workout.icon} slot="start" />
          <IonTitle>{workout.name}</IonTitle>
        </IonItem>
      ))}
    </IonList>
  )
};

const AddWorkoutButton = {
  view: ({ attrs }) => (
    <IonButton expand="full" onClick={attrs.navigateToNewWorkout}>
      Add Workout
    </IonButton>
  )
};

export default HomePage;
